/**
 * Seed DEV Fake OTP test accounts against Auth + Firestore emulators.
 *
 * Identifiers (not real email delivery) + Fake OTP `0000`:
 *   owner@ramkin.local, manager@ramkin.local, staff1@ramkin.local,
 *   customer1@ramkin.local, customer2@ramkin.local
 *
 * Usage:
 *   npx tsx scripts/seed-dev-accounts.local.ts --emulator --dry-run
 *   npx tsx scripts/seed-dev-accounts.local.ts --emulator
 *
 * Requires: firebase emulators (auth + firestore) running. Never hloe-45d43.
 */
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  DEFAULT_PURCHASES_REQUIRED,
  DEV_FAKE_OTP_CODE,
  createQrToken,
  type Role,
} from '../packages/shared/src/index';
import {
  assertNotHloe,
  hasFlag,
  initAdminApp,
  resolveProjectId,
} from './firebase-admin-local';

interface SeedAccount {
  email: string;
  phone: string;
  displayName: string;
  role: Role;
  /** Only CUSTOMER docs get combo/QR. */
  isCustomer: boolean;
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: 'owner@ramkin.local',
    phone: '+15550100001',
    displayName: 'Owner Dev',
    role: 'OWNER',
    isCustomer: false,
  },
  {
    email: 'manager@ramkin.local',
    phone: '+15550100002',
    displayName: 'Manager Dev',
    role: 'MANAGER',
    isCustomer: false,
  },
  {
    email: 'staff1@ramkin.local',
    phone: '+15550100003',
    displayName: 'Staff One',
    role: 'STAFF',
    isCustomer: false,
  },
  {
    email: 'customer1@ramkin.local',
    phone: '+15550101001',
    displayName: 'Customer One',
    role: 'CUSTOMER',
    isCustomer: true,
  },
  {
    email: 'customer2@ramkin.local',
    phone: '+15550101002',
    displayName: 'Customer Two',
    role: 'CUSTOMER',
    isCustomer: true,
  },
];

async function upsertAuthUser(account: SeedAccount): Promise<string> {
  const auth = getAuth();
  let uid: string;
  try {
    const byEmail = await auth.getUserByEmail(account.email);
    uid = byEmail.uid;
    await auth.updateUser(uid, {
      phoneNumber: account.phone,
      displayName: account.displayName,
      disabled: false,
    });
  } catch {
    try {
      const byPhone = await auth.getUserByPhoneNumber(account.phone);
      uid = byPhone.uid;
      await auth.updateUser(uid, {
        email: account.email,
        displayName: account.displayName,
        disabled: false,
      });
    } catch {
      const created = await auth.createUser({
        email: account.email,
        phoneNumber: account.phone,
        displayName: account.displayName,
        emailVerified: true,
      });
      uid = created.uid;
    }
  }
  await auth.setCustomUserClaims(uid, { role: account.role });
  return uid;
}

async function writeFirestoreDocs(uid: string, account: SeedAccount): Promise<void> {
  const db = getFirestore();
  const now = FieldValue.serverTimestamp();
  const userRef = db.collection('users').doc(uid);

  await userRef.set(
    {
      role: account.role,
      displayName: account.displayName,
      phone: account.phone,
      email: account.email,
      status: 'active',
      updatedAt: now,
      createdAt: now,
      lastLoginAt: null,
    },
    { merge: true },
  );

  if (!account.isCustomer) return;

  const customerRef = db.collection('customers').doc(uid);
  const existing = await customerRef.get();
  let comboId = existing.exists
    ? ((existing.data()?.currentComboId as string | undefined) ?? null)
    : null;
  let qrToken = existing.exists
    ? ((existing.data()?.qrToken as string | undefined) ?? null)
    : null;

  if (!comboId) {
    const comboRef = db.collection('combos').doc();
    comboId = comboRef.id;
    await comboRef.set({
      customerId: uid,
      status: 'active',
      purchaseCount: 0,
      requiredPurchases: DEFAULT_PURCHASES_REQUIRED,
      rewardRequestId: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      redeemedAt: null,
    });
  }
  if (!qrToken) {
    qrToken = createQrToken();
  }

  await customerRef.set(
    {
      uid,
      phone: account.phone,
      email: account.email,
      displayName: account.displayName,
      qrToken,
      currentComboId: comboId,
      totalPurchases: existing.exists
        ? ((existing.data()?.totalPurchases as number | undefined) ?? 0)
        : 0,
      totalRewardsRedeemed: existing.exists
        ? ((existing.data()?.totalRewardsRedeemed as number | undefined) ?? 0)
        : 0,
      createdAt: existing.exists ? (existing.data()?.createdAt ?? now) : now,
    },
    { merge: true },
  );
}

async function ensureLoyaltySettings(): Promise<void> {
  const db = getFirestore();
  const ref = db.collection('settings').doc('loyalty');
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({
    purchasesRequired: DEFAULT_PURCHASES_REQUIRED,
    staffCanApproveRewards: false,
    updatedBy: 'seed-dev-accounts',
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function printPlan(dryRun: boolean): void {
  console.log(`
RAMKIN DEV Fake OTP seed
────────────────────────
OTP code:     ${DEV_FAKE_OTP_CODE}  (DEV only — production rejects)
emulator:     required
dry-run:      ${dryRun}

Accounts (identifier OR phone + OTP ${DEV_FAKE_OTP_CODE}):
`);
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.padEnd(8)}  ${a.email.padEnd(24)}  ${a.phone}  (${a.displayName})`);
  }
  console.log(`
Login:
  Customer app  http://localhost:5173  → phone + ${DEV_FAKE_OTP_CODE}
  Admin app     http://localhost:5174  → identifier + ${DEV_FAKE_OTP_CODE}

Hard rules: never hloe-45d43; no Blaze; no Hosting publish; Fake OTP off in production builds.
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = hasFlag(argv, '--dry-run');
  const emulator = hasFlag(argv, '--emulator');

  if (!emulator && !dryRun) {
    throw new Error('Pass --emulator (Spark-safe). Staging ADC seed is not supported for Fake OTP accounts.');
  }

  printPlan(dryRun);
  if (dryRun) {
    console.log('Dry-run only — no writes.');
    return;
  }

  initAdminApp({ emulator: true });
  const projectId = resolveProjectId();
  assertNotHloe(projectId);

  await ensureLoyaltySettings();

  for (const account of ACCOUNTS) {
    const uid = await upsertAuthUser(account);
    await writeFirestoreDocs(uid, account);
    console.log(`✓ ${account.role} ${account.email} uid=${uid}`);
  }

  console.log('\nSeed complete. Sign in with identifier/phone + OTP 0000.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
