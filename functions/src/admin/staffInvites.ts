import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type Timestamp,
} from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  acceptStaffInviteSchema,
  canCreateStaffInvite,
  canDisableAccounts,
  cancelStaffInviteSchema,
  createStaffInviteSchema,
  listStaffInvitesSchema,
  type StaffInviteDto,
  type StaffInviteStatus,
} from '@ramkin/shared';
import { requireAuth, setRoleClaim } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { toIso } from './time';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toInviteDto(id: string, data: DocumentData): StaffInviteDto {
  return {
    inviteId: id,
    email: String(data.email ?? ''),
    role: data.role as 'MANAGER' | 'STAFF',
    status: data.status as StaffInviteStatus,
    createdBy: String(data.createdBy ?? ''),
    createdAt: toIso(data.createdAt as Timestamp | undefined),
    expiresAt: toIso(data.expiresAt as Timestamp | undefined),
    acceptedBy: (data.acceptedBy as string | null | undefined) ?? null,
    acceptedAt: toIso(data.acceptedAt as Timestamp | undefined),
  };
}

export const createStaffInvite = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  const input = createStaffInviteSchema.parse(request.data ?? {});

  if (!canCreateStaffInvite(actor.role, input.role)) {
    throw new HttpsError(
      'permission-denied',
      actor.role === 'MANAGER'
        ? 'MANAGER may invite STAFF only.'
        : 'OWNER or MANAGER access required.',
    );
  }

  const email = normalizeEmail(input.email);
  const db = getFirestore();
  const existingPending = await db
    .collection('staffInvites')
    .where('email', '==', email)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingPending.empty) {
    throw new HttpsError('already-exists', 'A pending invite already exists for this email.');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

  const ref = db.collection('staffInvites').doc();
  await ref.set({
    email,
    role: input.role,
    status: 'pending',
    createdBy: actor.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    acceptedBy: null,
    acceptedAt: null,
  });

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: ACTIVITY_ACTIONS.STAFF_INVITE_CREATED,
    entityType: 'staffInvite',
    entityId: ref.id,
    metadata: { email, role: input.role },
  });

  const snap = await ref.get();
  return { ok: true as const, invite: toInviteDto(ref.id, snap.data()!) };
});

export const listStaffInvites = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  if (!canDisableAccounts(actor.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }

  const input = listStaffInvitesSchema.parse(request.data ?? {});
  const db = getFirestore();

  let query = db.collection('staffInvites').orderBy('createdAt', 'desc').limit(input.limit);
  if (input.status) {
    query = db
      .collection('staffInvites')
      .where('status', '==', input.status)
      .orderBy('createdAt', 'desc')
      .limit(input.limit);
  }

  const snap = await query.get();
  const invites = snap.docs.map((doc) => toInviteDto(doc.id, doc.data()));
  return { ok: true as const, invites };
});

export const cancelStaffInvite = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  if (!canDisableAccounts(actor.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }

  const input = cancelStaffInviteSchema.parse(request.data ?? {});
  const db = getFirestore();
  const ref = db.collection('staffInvites').doc(input.inviteId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Invite not found.');
  }

  const data = snap.data()!;
  if (data.status !== 'pending') {
    throw new HttpsError('failed-precondition', `Invite is already ${data.status}.`);
  }

  if (actor.role === 'MANAGER' && data.role === 'MANAGER') {
    throw new HttpsError('permission-denied', 'MANAGER cannot cancel MANAGER invites.');
  }

  await ref.update({
    status: 'cancelled',
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: ACTIVITY_ACTIONS.STAFF_INVITE_CANCELLED,
    entityType: 'staffInvite',
    entityId: input.inviteId,
    metadata: { email: data.email },
  });

  return { ok: true as const, inviteId: input.inviteId, status: 'cancelled' as const };
});

/**
 * Signed-in staff candidate accepts a pending invite matching their Auth email.
 * Sets custom claim + users doc role from the invite.
 */
export const acceptStaffInvite = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  const input = acceptStaffInviteSchema.parse(request.data ?? {});

  const authUser = await getAuth().getUser(actor.uid);
  const email = authUser.email ? normalizeEmail(authUser.email) : null;
  if (!email) {
    throw new HttpsError('failed-precondition', 'An Auth email is required to accept an invite.');
  }

  if (actor.role === 'OWNER') {
    throw new HttpsError('failed-precondition', 'OWNER accounts cannot accept staff invites.');
  }

  const db = getFirestore();
  let inviteSnap;
  if (input.inviteId) {
    inviteSnap = await db.collection('staffInvites').doc(input.inviteId).get();
  } else {
    const found = await db
      .collection('staffInvites')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    inviteSnap = found.docs[0] ?? null;
  }

  if (!inviteSnap || !inviteSnap.exists) {
    throw new HttpsError('not-found', 'No pending invite found for this account.');
  }

  const data = inviteSnap.data()!;
  if (normalizeEmail(String(data.email)) !== email) {
    throw new HttpsError('permission-denied', 'Invite email does not match this account.');
  }
  if (data.status !== 'pending') {
    throw new HttpsError('failed-precondition', `Invite is already ${data.status}.`);
  }

  const expiresAt = data.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toDate().getTime() < Date.now()) {
    await inviteSnap.ref.update({ status: 'expired' });
    throw new HttpsError('failed-precondition', 'Invite has expired.');
  }

  const role = data.role as 'MANAGER' | 'STAFF';
  await setRoleClaim(actor.uid, role);

  const now = FieldValue.serverTimestamp();
  await db
    .collection('users')
    .doc(actor.uid)
    .set(
      {
        role,
        displayName: authUser.displayName || email.split('@')[0] || 'Staff',
        phone: authUser.phoneNumber ?? null,
        email,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      },
      { merge: true },
    );

  await inviteSnap.ref.update({
    status: 'accepted',
    acceptedBy: actor.uid,
    acceptedAt: now,
  });

  await writeActivityLog({
    actorUid: actor.uid,
    actorRole: role,
    action: ACTIVITY_ACTIONS.STAFF_INVITE_ACCEPTED,
    entityType: 'staffInvite',
    entityId: inviteSnap.id,
    metadata: { email, role },
  });

  return {
    ok: true as const,
    inviteId: inviteSnap.id,
    role,
    claimsRefreshRequired: true,
  };
});
