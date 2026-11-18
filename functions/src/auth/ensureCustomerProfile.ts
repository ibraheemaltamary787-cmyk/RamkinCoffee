import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  createQrToken,
  ensureCustomerProfileSchema,
  type CustomerProfileDto,
} from '@ramkin/shared';
import { requireAuth, setRoleClaim } from './claims';
import { writeActivityLog } from './activity';

function toIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') return null;
  return value.toDate().toISOString();
}

export const ensureCustomerProfile = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  const input = ensureCustomerProfileSchema.parse(request.data ?? {});

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

  const phone = authUser.phoneNumber ?? auth.phone;
  if (!phone) {
    throw new HttpsError(
      'failed-precondition',
      'Phone-authenticated customer required. Complete OTP first.',
    );
  }

  const displayName =
    input.displayName?.trim() ||
    authUser.displayName?.trim() ||
    `Guest ${phone.slice(-4)}`;

  const db = getFirestore();
  const userRef = db.collection('users').doc(auth.uid);
  const customerRef = db.collection('customers').doc(auth.uid);

  let created = false;

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(userRef);
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
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      tx.set(
        customerRef,
        {
          displayName,
          phone,
        },
        { merge: true },
      );
      return;
    }

    created = true;
    const now = FieldValue.serverTimestamp();
    tx.set(userRef, {
      role: 'CUSTOMER',
      displayName,
      phone,
      email: authUser.email ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
    tx.set(customerRef, {
      uid: auth.uid,
      phone,
      displayName,
      qrToken: createQrToken(),
      currentComboId: null,
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
      metadata: { phoneLast4: phone.slice(-4) },
    });
  }

  const snap = await userRef.get();
  const data = snap.data()!;
  const dto: CustomerProfileDto = {
    uid: auth.uid,
    role: 'CUSTOMER',
    displayName: data.displayName ?? displayName,
    phone: data.phone ?? phone,
    email: data.email ?? null,
    status: data.status ?? 'active',
    lastLoginAt: toIso(data.lastLoginAt),
  };

  return { ok: true as const, created, profile: dto, claimsRefreshRequired: created || !auth.role };
});
