import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ACTIVITY_ACTIONS, bootstrapOwnerSchema } from '@ramkin/shared';
import { requireAuth, setRoleClaim } from './claims';
import { writeActivityLog } from './activity';

/**
 * One-shot OWNER bootstrap secret. Configure in Firebase Functions secrets /
 * runtime env after creating the RAMKIN project. Never put this in Vite env.
 */
const bootstrapOwnerSecret = defineSecret('BOOTSTRAP_OWNER_SECRET');

export const bootstrapOwner = onCall(
  { cors: true, secrets: [bootstrapOwnerSecret] },
  async (request) => {
    const auth = requireAuth(request);
    const input = bootstrapOwnerSchema.parse(request.data ?? {});

    const expected = bootstrapOwnerSecret.value();
    if (!expected || expected.length < 16) {
      throw new HttpsError(
        'failed-precondition',
        'BOOTSTRAP_OWNER_SECRET is not configured on Functions. Set it in Firebase Console / Secret Manager first.',
      );
    }
    if (input.secret !== expected) {
      throw new HttpsError('permission-denied', 'Invalid bootstrap secret.');
    }

    const db = getFirestore();
    const owners = await db.collection('users').where('role', '==', 'OWNER').limit(1).get();
    if (!owners.empty) {
      throw new HttpsError(
        'already-exists',
        'An OWNER already exists. Bootstrap is locked. Use setStaffRole for further grants.',
      );
    }

    const authUser = await getAuth().getUser(auth.uid);
    if (!authUser.email) {
      throw new HttpsError(
        'failed-precondition',
        'OWNER bootstrap requires an email/password Auth user.',
      );
    }

    await setRoleClaim(auth.uid, 'OWNER');

    const now = FieldValue.serverTimestamp();
    await db.collection('users').doc(auth.uid).set(
      {
        role: 'OWNER',
        displayName: authUser.displayName?.trim() || authUser.email.split('@')[0] || 'Owner',
        phone: authUser.phoneNumber ?? null,
        email: authUser.email,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      },
      { merge: true },
    );

    await writeActivityLog({
      actorUid: auth.uid,
      actorRole: 'OWNER',
      action: ACTIVITY_ACTIONS.BOOTSTRAP_OWNER,
      entityType: 'user',
      entityId: auth.uid,
      metadata: { email: authUser.email },
    });

    return {
      ok: true as const,
      uid: auth.uid,
      role: 'OWNER' as const,
      claimsRefreshRequired: true,
      message: 'OWNER claim set. Force token refresh, then remove or rotate BOOTSTRAP_OWNER_SECRET.',
    };
  },
);
