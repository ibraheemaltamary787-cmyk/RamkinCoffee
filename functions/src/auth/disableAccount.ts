import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ACTIVITY_ACTIONS, disableAccountSchema } from '@ramkin/shared';
import { requireCanDisable } from './claims';
import { writeActivityLog } from './activity';

export const disableAccount = onCall({ cors: true }, async (request) => {
  const actor = requireCanDisable(request);
  const input = disableAccountSchema.parse(request.data ?? {});

  if (input.uid === actor.uid) {
    throw new HttpsError('invalid-argument', 'Cannot disable your own account.');
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(input.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'User document not found.');
  }

  const target = snap.data()!;
  if (target.role === 'OWNER') {
    throw new HttpsError('permission-denied', 'Cannot disable an OWNER account.');
  }
  if (actor.role === 'MANAGER' && (target.role === 'MANAGER' || target.role === 'OWNER')) {
    throw new HttpsError('permission-denied', 'MANAGER cannot disable MANAGER or OWNER.');
  }

  await getAuth().updateUser(input.uid, { disabled: input.disabled });

  await userRef.set(
    {
      status: input.disabled ? 'disabled' : 'active',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: input.disabled ? ACTIVITY_ACTIONS.DISABLE_ACCOUNT : ACTIVITY_ACTIONS.ENABLE_ACCOUNT,
    entityType: 'user',
    entityId: input.uid,
    metadata: { previousStatus: target.status ?? null, role: target.role ?? null },
  });

  return {
    ok: true as const,
    uid: input.uid,
    status: input.disabled ? ('disabled' as const) : ('active' as const),
  };
});
