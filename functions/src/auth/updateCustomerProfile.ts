import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  updateCustomerProfileSchema,
  type CustomerProfileDto,
} from '@ramkin/shared';
import { requireAuth } from './claims';
import { writeActivityLog } from './activity';

function toIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') return null;
  return value.toDate().toISOString();
}

export const updateCustomerProfile = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  const input = updateCustomerProfileSchema.parse(request.data ?? {});

  if (auth.role && auth.role !== 'CUSTOMER') {
    throw new HttpsError(
      'permission-denied',
      'Only customer accounts update profile on this path.',
    );
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(auth.uid);
  const customerRef = db.collection('customers').doc(auth.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Complete registration before updating profile.');
  }

  const existing = snap.data()!;
  if (existing.status === 'disabled') {
    throw new HttpsError('permission-denied', 'This account is disabled.');
  }
  if (existing.role !== 'CUSTOMER') {
    throw new HttpsError('permission-denied', 'Not a customer profile.');
  }

  await db.runTransaction(async (tx) => {
    tx.set(
      userRef,
      {
        displayName: input.displayName,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(
      customerRef,
      {
        displayName: input.displayName,
      },
      { merge: true },
    );
  });

  await writeActivityLog({
    actorUid: auth.uid,
    actorRole: 'CUSTOMER',
    action: ACTIVITY_ACTIONS.UPDATE_PROFILE,
    entityType: 'user',
    entityId: auth.uid,
    metadata: { displayName: input.displayName },
  });

  const updated = (await userRef.get()).data()!;
  const dto: CustomerProfileDto = {
    uid: auth.uid,
    role: 'CUSTOMER',
    displayName: updated.displayName,
    phone: updated.phone ?? null,
    email: updated.email ?? null,
    status: updated.status ?? 'active',
    lastLoginAt: toIso(updated.lastLoginAt),
  };

  return { ok: true as const, profile: dto };
});
