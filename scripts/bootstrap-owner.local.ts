/**
 * Local Admin SDK helper to bootstrap the first OWNER.
 * Requires GOOGLE_APPLICATION_CREDENTIALS pointing at a gitignored
 * RAMKIN service-account JSON. Never point at hloe-45d43.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-owner.local.ts --uid <AUTH_UID>
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function readUid(): string {
  const idx = process.argv.indexOf('--uid');
  const uid = idx >= 0 ? process.argv[idx + 1] : undefined;
  if (!uid) {
    console.error('Usage: npx tsx scripts/bootstrap-owner.local.ts --uid <AUTH_UID>');
    process.exit(1);
  }
  return uid;
}

async function main(): Promise<void> {
  const uid = readUid();
  initializeApp({ credential: applicationDefault() });

  const db = getFirestore();
  const owners = await db.collection('users').where('role', '==', 'OWNER').limit(1).get();
  if (!owners.empty) {
    throw new Error('An OWNER already exists — refusing to bootstrap.');
  }

  const user = await getAuth().getUser(uid);
  if (!user.email) {
    throw new Error('Target Auth user must have an email.');
  }

  await getAuth().setCustomUserClaims(uid, { role: 'OWNER' });

  const now = FieldValue.serverTimestamp();
  await db.collection('users').doc(uid).set(
    {
      role: 'OWNER',
      displayName: user.displayName?.trim() || user.email.split('@')[0],
      phone: user.phoneNumber ?? null,
      email: user.email,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    },
    { merge: true },
  );

  await db.collection('activityLogs').add({
    actorUid: uid,
    actorRole: 'OWNER',
    action: 'role.bootstrap_owner',
    entityType: 'user',
    entityId: uid,
    metadata: { via: 'local-script', email: user.email },
    createdAt: now,
  });

  console.log(`OWNER claim set for ${uid} (${user.email}). Force token refresh on next login.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
