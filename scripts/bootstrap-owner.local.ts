/**
 * Local Admin SDK helper to bootstrap the first OWNER.
 *
 * Prefer emulators on Spark keep-free (no Blaze / no production ADC required):
 *   npx tsx scripts/bootstrap-owner.local.ts --emulator --uid <AUTH_UID>
 *
 * Staging ADC (gitignored service account for ramkincoffee only):
 *   npx tsx scripts/bootstrap-owner.local.ts --uid <AUTH_UID>
 *
 * Never point at hloe-45d43. Never invent Firebase projects or secrets into the repo.
 */
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  argValue,
  assertNotHloe,
  hasFlag,
  initAdminApp,
  resolveProjectId,
} from './firebase-admin-local';

function readUid(argv: string[]): string {
  const uid = argValue(argv, '--uid');
  if (!uid) {
    console.error('Usage: npx tsx scripts/bootstrap-owner.local.ts [--emulator] --uid <AUTH_UID>');
    process.exit(1);
  }
  return uid;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const emulator = hasFlag(argv, '--emulator');
  const uid = readUid(argv);

  initAdminApp({ emulator });
  const projectId = resolveProjectId();
  assertNotHloe(projectId);

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
  await db
    .collection('users')
    .doc(uid)
    .set(
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
    metadata: {
      via: emulator ? 'local-script-emulator' : 'local-script',
      email: user.email,
      projectId,
    },
    createdAt: now,
  });

  console.log(
    `OWNER claim set for ${uid} (${user.email}) on ${projectId}${emulator ? ' [emulator]' : ''}. Force token refresh on next login.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
