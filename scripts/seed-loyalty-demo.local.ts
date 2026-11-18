/**
 * Staging demo seed for RAMKIN loyalty UAT.
 *
 * Never point at hloe-45d43. Never invent Firebase projects or secrets.
 * Requires GOOGLE_APPLICATION_CREDENTIALS (gitignored) for a *RAMKIN* project,
 * or pass --dry-run to print the fixture plan without writing.
 *
 * Usage:
 *   npx tsx scripts/seed-loyalty-demo.local.ts --dry-run
 *   npx tsx scripts/seed-loyalty-demo.local.ts --phone +15550109999 --n 3
 *   npx tsx scripts/seed-loyalty-demo.local.ts --phone +15550109999 --n 2 --stop-at approved
 *
 * --stop-at: purchases | requested | approved | redeemed (default: approved)
 */
import { randomUUID } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  DEFAULT_PURCHASES_REQUIRED,
  applyApproveReward,
  applyPurchaseToCombo,
  applyRedeemReward,
  applyRequestReward,
  createQrToken,
  normalizePhone,
} from '../packages/shared/src/index';

type StopAt = 'purchases' | 'requested' | 'approved' | 'redeemed';

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseArgs(): {
  dryRun: boolean;
  phone: string;
  n: number;
  stopAt: StopAt;
  displayName: string;
} {
  const dryRun = hasFlag('--dry-run');
  const phoneRaw = argValue('--phone') ?? '+15550109999';
  const phone = normalizePhone(phoneRaw);
  const n = Number(argValue('--n') ?? '3');
  const stopAt = (argValue('--stop-at') ?? 'approved') as StopAt;
  const displayName = argValue('--name') ?? 'Demo Guest';

  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error('--n must be an integer 1–100 (use a small N for short demos).');
  }
  if (!['purchases', 'requested', 'approved', 'redeemed'].includes(stopAt)) {
    throw new Error('--stop-at must be purchases|requested|approved|redeemed');
  }
  if (!/^\+[0-9]{8,18}$/.test(phone)) {
    throw new Error('--phone must be E.164 digits with leading +');
  }
  return { dryRun, phone, n, stopAt, displayName };
}

function printPlan(opts: ReturnType<typeof parseArgs>): void {
  console.log(`
RAMKIN loyalty demo seed plan
─────────────────────────────
phone:        ${opts.phone}
displayName:  ${opts.displayName}
N (stamps):   ${opts.n}  (settings.purchasesRequired for this demo combo)
stop-at:      ${opts.stopAt}
dry-run:      ${opts.dryRun}

Steps:
  1. Ensure settings/loyalty exists (default purchasesRequired=${DEFAULT_PURCHASES_REQUIRED})
  2. Create/get Auth user by phone; claim role=CUSTOMER
  3. Write users/{uid} + customers/{uid} + active combo (requiredPurchases=${opts.n})
  4. Record ${opts.n} purchases with unique idempotency keys → combo completed
  5. Optionally request → approve → redeem per --stop-at

UAT next:
  - Admin Counter: lookup ${opts.phone} or scan QR
  - Customer dashboard: progress / reward status
  - Reports: export after redeem

Hard rules: never hloe-45d43; never commit service-account JSON.
`);
}

async function main(): Promise<void> {
  const opts = parseArgs();
  printPlan(opts);

  if (opts.dryRun) {
    console.log('Dry-run only — no Firebase writes. Remove --dry-run when staging ADC is ready.');
    return;
  }

  initializeApp({ credential: applicationDefault() });
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    '';
  if (projectId === 'hloe-45d43') {
    throw new Error('Refusing to seed hloe-45d43 — create a RAMKIN Firebase project first.');
  }

  const auth = getAuth();
  const db = getFirestore();

  // 1. Settings singleton (merge; do not wipe OWNER customizations blindly).
  const settingsRef = db.collection('settings').doc('loyalty');
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      purchasesRequired: DEFAULT_PURCHASES_REQUIRED,
      staffCanApproveRewards: false,
      updatedBy: 'seed-loyalty-demo',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // 2. Auth user by phone
  let user;
  try {
    user = await auth.getUserByPhoneNumber(opts.phone);
  } catch {
    user = await auth.createUser({
      phoneNumber: opts.phone,
      displayName: opts.displayName,
    });
  }
  await auth.setCustomUserClaims(user.uid, { role: 'CUSTOMER' });

  const qrToken = createQrToken();
  const comboRef = db.collection('combos').doc();
  const now = FieldValue.serverTimestamp();

  await db
    .collection('users')
    .doc(user.uid)
    .set(
      {
        role: 'CUSTOMER',
        displayName: opts.displayName,
        phone: opts.phone,
        email: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      },
      { merge: true },
    );

  await db
    .collection('customers')
    .doc(user.uid)
    .set(
      {
        uid: user.uid,
        phone: opts.phone,
        displayName: opts.displayName,
        qrToken,
        currentComboId: comboRef.id,
        totalPurchases: 0,
        totalRewardsRedeemed: 0,
        createdAt: now,
      },
      { merge: true },
    );

  let combo = {
    id: comboRef.id,
    customerId: user.uid,
    requiredPurchases: opts.n,
    purchaseCount: 0,
    status: 'active' as const,
    rewardRequestId: null as string | null,
  };

  await comboRef.set({
    customerId: user.uid,
    requiredPurchases: opts.n,
    purchaseCount: 0,
    status: 'active',
    rewardRequestId: null,
    startedAt: now,
    completedAt: null,
    redeemedAt: null,
  });

  const purchaseIds: string[] = [];
  for (let i = 0; i < opts.n; i += 1) {
    const transition = applyPurchaseToCombo(combo);
    const idempotencyKey = `seed-${user.uid.slice(0, 8)}-${randomUUID()}`;
    purchaseIds.push(idempotencyKey);
    await db.collection('purchases').doc(idempotencyKey).set({
      customerId: user.uid,
      comboId: combo.id,
      recordedBy: 'seed-loyalty-demo',
      amount: null,
      note: `seed stamp ${i + 1}/${opts.n}`,
      idempotencyKey,
      clientRequestId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    combo = {
      ...combo,
      purchaseCount: transition.purchaseCount,
      status: transition.status as typeof combo.status,
    };
  }

  await comboRef.update({
    purchaseCount: combo.purchaseCount,
    status: combo.status,
    completedAt: combo.status === 'completed' ? FieldValue.serverTimestamp() : null,
  });
  await db
    .collection('customers')
    .doc(user.uid)
    .set({ totalPurchases: opts.n, currentComboId: combo.id }, { merge: true });

  let rewardId: string | null = null;

  if (opts.stopAt !== 'purchases') {
    const requested = applyRequestReward(combo);
    rewardId = db.collection('rewardRequests').doc().id;
    await db.collection('rewardRequests').doc(rewardId).set({
      customerId: user.uid,
      comboId: combo.id,
      status: 'requested',
      requestedAt: FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      rejectedReason: null,
      redeemedBy: null,
      redeemedAt: null,
    });
    combo = {
      ...combo,
      status: requested.comboStatus as typeof combo.status,
      rewardRequestId: rewardId,
    };
    await comboRef.update({ status: combo.status, rewardRequestId: rewardId });
  }

  if (opts.stopAt === 'approved' || opts.stopAt === 'redeemed') {
    if (!rewardId) throw new Error('internal: missing rewardId');
    const approved = applyApproveReward(combo, {
      id: rewardId,
      customerId: user.uid,
      comboId: combo.id,
      status: 'requested',
      rejectedReason: null,
    });
    await db.collection('rewardRequests').doc(rewardId).update({
      status: 'approved',
      reviewedBy: 'seed-loyalty-demo',
      reviewedAt: FieldValue.serverTimestamp(),
    });
    combo = { ...combo, status: approved.comboStatus as typeof combo.status };
    await comboRef.update({ status: combo.status });
  }

  if (opts.stopAt === 'redeemed') {
    if (!rewardId) throw new Error('internal: missing rewardId');
    const redeemed = applyRedeemReward(
      combo,
      {
        id: rewardId,
        customerId: user.uid,
        comboId: combo.id,
        status: 'approved',
        rejectedReason: null,
      },
      DEFAULT_PURCHASES_REQUIRED,
    );
    const newComboRef = db.collection('combos').doc();
    await db.collection('rewardRequests').doc(rewardId).update({
      status: 'redeemed',
      redeemedBy: 'seed-loyalty-demo',
      redeemedAt: FieldValue.serverTimestamp(),
    });
    await comboRef.update({
      status: redeemed.oldComboStatus,
      redeemedAt: FieldValue.serverTimestamp(),
    });
    await newComboRef.set({
      customerId: user.uid,
      requiredPurchases: redeemed.newCombo.requiredPurchases,
      purchaseCount: 0,
      status: 'active',
      rewardRequestId: null,
      startedAt: FieldValue.serverTimestamp(),
      completedAt: null,
      redeemedAt: null,
    });
    await db
      .collection('customers')
      .doc(user.uid)
      .set(
        {
          currentComboId: newComboRef.id,
          totalRewardsRedeemed: FieldValue.increment(1),
        },
        { merge: true },
      );
    combo = {
      id: newComboRef.id,
      customerId: user.uid,
      requiredPurchases: redeemed.newCombo.requiredPurchases,
      purchaseCount: 0,
      status: 'active',
      rewardRequestId: null,
    };
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId: projectId || '(from ADC)',
        customerId: user.uid,
        phone: opts.phone,
        qrToken,
        comboId: combo.id,
        comboStatus: combo.status,
        purchaseCount: combo.purchaseCount,
        requiredPurchases: combo.requiredPurchases,
        rewardRequestId: rewardId,
        purchaseIds,
        stopAt: opts.stopAt,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
