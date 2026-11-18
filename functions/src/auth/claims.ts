import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import {
  canDisableAccounts,
  canManageStaffRoles,
  isStaffRole,
  type Role,
  type StaffRole,
} from '@ramkin/shared';

export interface AuthContext {
  uid: string;
  role: Role | null;
  email: string | null;
  phone: string | null;
  token: CallableRequest['auth'];
}

export function requireAuth(request: CallableRequest): AuthContext {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const roleClaim = request.auth.token.role;
  const role =
    typeof roleClaim === 'string' &&
    (roleClaim === 'OWNER' ||
      roleClaim === 'MANAGER' ||
      roleClaim === 'STAFF' ||
      roleClaim === 'CUSTOMER')
      ? roleClaim
      : null;

  return {
    uid: request.auth.uid,
    role,
    email: typeof request.auth.token.email === 'string' ? request.auth.token.email : null,
    phone:
      typeof request.auth.token.phone_number === 'string'
        ? request.auth.token.phone_number
        : null,
    token: request.auth,
  };
}

export function requireStaff(request: CallableRequest): AuthContext & { role: StaffRole } {
  const ctx = requireAuth(request);
  if (!isStaffRole(ctx.role)) {
    throw new HttpsError('permission-denied', 'Staff access required.');
  }
  return { ...ctx, role: ctx.role };
}

export function requireOwner(request: CallableRequest): AuthContext & { role: 'OWNER' } {
  const ctx = requireAuth(request);
  if (ctx.role !== 'OWNER') {
    throw new HttpsError('permission-denied', 'OWNER access required.');
  }
  return { ...ctx, role: 'OWNER' };
}

export function requireCanDisable(request: CallableRequest): AuthContext {
  const ctx = requireAuth(request);
  if (!canDisableAccounts(ctx.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }
  return ctx;
}

export function requireCanManageStaff(request: CallableRequest): AuthContext {
  const ctx = requireAuth(request);
  if (!canManageStaffRoles(ctx.role)) {
    throw new HttpsError('permission-denied', 'OWNER access required.');
  }
  return ctx;
}

export async function setRoleClaim(uid: string, role: Role): Promise<void> {
  await getAuth().setCustomUserClaims(uid, { role });
}

export async function getUserRoleFromAuth(uid: string): Promise<Role | null> {
  const user = await getAuth().getUser(uid);
  const role = user.customClaims?.role;
  if (
    role === 'OWNER' ||
    role === 'MANAGER' ||
    role === 'STAFF' ||
    role === 'CUSTOMER'
  ) {
    return role;
  }
  return null;
}
