import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { ZodError } from 'zod';
import {
  ACTIVITY_ACTIONS,
  createQrToken,
  ensureCustomerProfileSchema,
  type CustomerProfileDto,
} from '@ramkin/shared';
import { requireAuth, setRoleClaim } from './claims';
import { writeActivityLog } from './activity';
import { ensureLoyaltySettingsDoc } from '../loyalty/settings';
import { createActiveComboInTx } from '../loyalty/combo';

function toIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') return null;
  return value.toDate().toISOString();
}

export const ensureCustomerProfile = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  let input;
  try {
    input = ensureCustomerProfileSchema.parse(request.data ?? {});
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      const path = issue?.path?.length ? issue.path.join('.') : 'input';
      throw new HttpsError(
        'invalid-argument',
        `${path}: ${issue?.message ?? 'Invalid profile input.'}`,
      );
    }
    throw err;
  }

  // Staff must not accidentally get demoted via this customer path.
  if (auth.role === 'OWNER' || auth.role === 'MANAGER' || auth.role === 'STAFF') {
    throw new HttpsError(
      'failed-precondition',
      'Staff accounts cannot enroll as customers on this path.',
    );
  }

  const authUser = await getAuth().getUser(auth.uid);
  if (authUser.disabled) {
    throw new HttpsError('permission-denied', 'This account is disabled.');
  }

  const phone = authUser.phoneNumber ?? auth.phone ?? null;
  const email = authUser.email ?? auth.email ?? null;

  // Spark keep-free: Email/Password is the default. Phone OTP remains optional (emulator / test numbers).
  if (!phone && !email) {
    throw new HttpsError(
      'failed-precondition',
      'Email/password or phone sign-in required before creating a customer profile.',
    );
  }

  const displayName =
    input.displayName?.trim() ||
    authUser.displayName?.trim() ||
    (email ? email.split('@')[0]! : null) ||
    (phone ? `Guest ${phone.slice(-4)}` : 'Guest');

  const db = getFirestore();
  const settings = await ensureLoyaltySettingsDoc(db);
  const userRef = db.collection('users').doc(auth.uid);
  const customerRef = db.collection('customers').doc(auth.uid);

  let created = false;
  let comboCreated = false;
  let currentComboId: string | null = null;
  let qrToken: string | null = null;

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(userRef);
    const existingCustomer = await tx.get(customerRef);

    if (existing.exists) {
      const data = existing.data()!;
      if (data.status === 'disabled') {
        throw new HttpsError('permission-denied', 'This account is disabled.');
      }
      if (data.role && data.role !== 'CUSTOMER') {
        throw new HttpsError(
          'failed-precondition',
          'This account already has a non-customer role.',
        );
      }
      tx.set(
        userRef,
        {
          displayName,
          phone,
          email,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const customerData = existingCustomer.exists ? existingCustomer.data()! : {};
      currentComboId = (customerData.currentComboId as string | null | undefined) ?? null;
      qrToken = (customerData.qrToken as string | null | undefined) ?? null;

      const customerPatch: Record<string, unknown> = {
        displayName,
        phone,
        email,
      };

      if (!qrToken) {
        qrToken = createQrToken();
        customerPatch.qrToken = qrToken;
      }

      if (!currentComboId) {
        const createdCombo = createActiveComboInTx(tx, db, {
          customerId: auth.uid,
          requiredPurchases: settings.purchasesRequired,
        });
        currentComboId = createdCombo.comboId;
        customerPatch.currentComboId = currentComboId;
        comboCreated = true;
      }

      tx.set(customerRef, customerPatch, { merge: true });
      return;
    }

    created = true;
    const now = FieldValue.serverTimestamp();
    qrToken = createQrToken();
    const createdCombo = createActiveComboInTx(tx, db, {
      customerId: auth.uid,
      requiredPurchases: settings.purchasesRequired,
    });
    currentComboId = createdCombo.comboId;
    comboCreated = true;

    tx.set(userRef, {
      role: 'CUSTOMER',
      displayName,
      phone,
      email,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
    tx.set(customerRef, {
      uid: auth.uid,
      phone,
      email,
      displayName,
      qrToken,
      currentComboId,
      totalPurchases: 0,
      totalRewardsRedeemed: 0,
      createdAt: now,
    });
  });

  if (!auth.role || auth.role === 'CUSTOMER') {
    await setRoleClaim(auth.uid, 'CUSTOMER');
  }

  if (created) {
    await writeActivityLog({
      actorUid: auth.uid,
      actorRole: 'CUSTOMER',
      action: ACTIVITY_ACTIONS.ENSURE_CUSTOMER,
      entityType: 'user',
      entityId: auth.uid,
      metadata: {
        phoneLast4: phone ? phone.slice(-4) : null,
        emailDomain: email?.includes('@') ? email.split('@')[1] : null,
        comboId: currentComboId,
        comboCreated,
      },
    });
  }

  const snap = await userRef.get();
  const data = snap.data()!;
  const dto: CustomerProfileDto = {
    uid: auth.uid,
    role: 'CUSTOMER',
    displayName: data.displayName ?? displayName,
    phone: data.phone ?? phone,
    email: data.email ?? email,
    status: data.status ?? 'active',
    lastLoginAt: toIso(data.lastLoginAt),
    currentComboId,
    qrToken,
  };

  return {
    ok: true as const,
    created,
    comboCreated,
    profile: dto,
    claimsRefreshRequired: created || !auth.role,
  };
});
