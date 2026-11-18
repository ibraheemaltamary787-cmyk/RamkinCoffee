import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  canRotateCustomerQr,
  createQrToken,
  rotateCustomerQrSchema,
} from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { assertAppCheck } from '../security/appCheck';

/**
 * Invalidate a leaked / lost counter QR by issuing a new opaque token.
 * Old printed codes and deep links stop resolving immediately.
 */
export const rotateCustomerQr = onCall({ cors: true }, async (request) => {
  assertAppCheck(request, 'rotateCustomerQr');
  const actor = requireAuth(request);
  if (!canRotateCustomerQr(actor.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }

  const input = rotateCustomerQrSchema.parse(request.data ?? {});
  const db = getFirestore();
  const customerRef = db.collection('customers').doc(input.customerId);
  const snap = await customerRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Customer not found.');
  }

  const previous = String(snap.data()?.qrToken ?? '');
  const qrToken = createQrToken();

  await customerRef.set(
    {
      qrToken,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: ACTIVITY_ACTIONS.QR_ROTATED,
    entityType: 'customer',
    entityId: input.customerId,
    metadata: {
      previousSuffix: previous.slice(-4) || null,
      newSuffix: qrToken.slice(-4),
    },
  });

  return {
    ok: true as const,
    customerId: input.customerId,
    qrToken,
  };
});
