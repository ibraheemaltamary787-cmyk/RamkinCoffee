import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ACTIVITY_ACTIONS, recordLoginSchema } from '@ramkin/shared';
import { requireAuth } from './claims';
import { writeActivityLog } from './activity';

export const recordLogin = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  const input = recordLoginSchema.parse(request.data ?? {});

  const db = getFirestore();
  const userRef = db.collection('users').doc(auth.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'User profile missing. Call ensureCustomerProfile or complete staff bootstrap first.',
    );
  }

  const data = snap.data()!;
  if (data.status === 'disabled') {
    throw new HttpsError('permission-denied', 'This account is disabled.');
  }

  await userRef.set(
    {
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeActivityLog({
    actorUid: auth.uid,
    actorRole: auth.role ?? data.role ?? 'unknown',
    action: ACTIVITY_ACTIONS.LOGIN,
    entityType: 'user',
    entityId: auth.uid,
    metadata: { client: input.client },
  });

  return { ok: true as const };
});
