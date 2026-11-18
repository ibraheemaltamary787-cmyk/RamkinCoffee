import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  canDisableAccounts,
  listStaffSchema,
  type Role,
  type StaffMemberDto,
  type UserStatus,
} from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { toIso } from './time';

const STAFF_ROLES: Role[] = ['OWNER', 'MANAGER', 'STAFF'];

export const listStaff = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  if (!canDisableAccounts(actor.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }

  const input = listStaffSchema.parse(request.data ?? {});
  const db = getFirestore();
  const members: StaffMemberDto[] = [];

  for (const role of STAFF_ROLES) {
    const snap = await db.collection('users').where('role', '==', role).limit(input.limit).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      members.push({
        uid: doc.id,
        displayName: String(data.displayName ?? ''),
        email: (data.email as string | null | undefined) ?? null,
        phone: (data.phone as string | null | undefined) ?? null,
        role: data.role as Role,
        status: (data.status as UserStatus | undefined) ?? 'active',
        lastLoginAt: toIso(data.lastLoginAt as Timestamp | undefined),
        createdAt: toIso(data.createdAt as Timestamp | undefined),
      });
    }
  }

  members.sort((a, b) => {
    const order = { OWNER: 0, MANAGER: 1, STAFF: 2, CUSTOMER: 3 } as const;
    const roleDiff = order[a.role] - order[b.role];
    if (roleDiff !== 0) return roleDiff;
    return a.displayName.localeCompare(b.displayName);
  });

  return { ok: true as const, staff: members.slice(0, input.limit) };
});
