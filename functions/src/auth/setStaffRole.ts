import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ACTIVITY_ACTIONS, setStaffRoleSchema } from '@ramkin/shared';
import { requireCanManageStaff, setRoleClaim } from './claims';
import { writeActivityLog } from './activity';

export const setStaffRole = onCall({ cors: true }, async (request) => {
  const actor = requireCanManageStaff(request);
  const input = setStaffRoleSchema.parse(request.data ?? {});

  if (input.uid === actor.uid) {
    throw new HttpsError('invalid-argument', 'Cannot change your own role via this callable.');
  }

  const authUser = await getAuth().getUser(input.uid).catch(() => {
    throw new HttpsError('not-found', 'Auth user not found.');
  });

  const db = getFirestore();
  const userRef = db.collection('users').doc(input.uid);
  const existing = await userRef.get();
  if (existing.exists && existing.data()?.role === 'OWNER') {
    throw new HttpsError('permission-denied', 'Cannot demote or reassign an OWNER via this callable.');
  }

  await setRoleClaim(input.uid, input.role);

  const now = FieldValue.serverTimestamp();
  await userRef.set(
    {
      role: input.role,
      displayName:
        existing.data()?.displayName ||
        authUser.displayName ||
        authUser.email?.split('@')[0] ||
        'Staff',
      phone: authUser.phoneNumber ?? existing.data()?.phone ?? null,
      email: authUser.email ?? existing.data()?.email ?? null,
      status: existing.data()?.status ?? 'active',
      createdAt: existing.data()?.createdAt ?? now,
      updatedAt: now,
      lastLoginAt: existing.data()?.lastLoginAt ?? null,
    },
    { merge: true },
  );

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: ACTIVITY_ACTIONS.SET_STAFF_ROLE,
    entityType: 'user',
    entityId: input.uid,
    metadata: { role: input.role, email: authUser.email ?? null },
  });

  return { ok: true as const, uid: input.uid, role: input.role, claimsRefreshRequired: true };
});
