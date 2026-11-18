/** Shared types, schemas, and constants for RAMKIN Coffee apps + Functions. */

import { z } from 'zod';

export const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ['OWNER', 'MANAGER', 'STAFF'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const COMBO_STATUSES = [
  'active',
  'completed',
  'reward_pending',
  'reward_approved',
  'redeemed',
  'cancelled',
] as const;
export type ComboStatus = (typeof COMBO_STATUSES)[number];

export const REWARD_REQUEST_STATUSES = ['requested', 'approved', 'rejected', 'redeemed'] as const;
export type RewardRequestStatus = (typeof REWARD_REQUEST_STATUSES)[number];

/** Default paid stamps before free drink (buy 9 → 10th free). */
export const DEFAULT_PURCHASES_REQUIRED = 9;

export const BRAND = {
  name: 'RAMKIN',
  product: 'RAMKIN Coffee',
  tagline: 'Loyalty, refined.',
} as const;

/** Activity log action names used in Phase 3+. */
export const ACTIVITY_ACTIONS = {
  LOGIN: 'auth.login',
  BOOTSTRAP_OWNER: 'role.bootstrap_owner',
  SET_STAFF_ROLE: 'role.set_staff',
  DISABLE_ACCOUNT: 'account.disable',
  ENABLE_ACCOUNT: 'account.enable',
  UPDATE_PROFILE: 'profile.update',
  ENSURE_CUSTOMER: 'auth.ensure_customer',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export interface LoyaltySettings {
  purchasesRequired: number;
}

/** Firestore `users/{uid}` shape (timestamps as ISO strings on clients / DTOs). */
export interface UserDoc {
  role: Role;
  displayName: string;
  phone: string | null;
  email: string | null;
  status: UserStatus;
  createdAt: unknown;
  updatedAt: unknown;
  lastLoginAt: unknown | null;
}

/** Safe customer profile fields exposed to the client. */
export interface CustomerProfileDto {
  uid: string;
  role: Role;
  displayName: string;
  phone: string | null;
  email: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
}

export const roleSchema = z.enum(ROLES);
export const staffRoleSchema = z.enum(STAFF_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

export const ensureCustomerProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
});

export const updateCustomerProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export const recordLoginSchema = z.object({
  client: z.enum(['customer', 'admin']).default('customer'),
});

export const bootstrapOwnerSchema = z.object({
  /** One-shot secret from Functions env `BOOTSTRAP_OWNER_SECRET` — never from Vite. */
  secret: z.string().min(16).max(256),
});

export const setStaffRoleSchema = z.object({
  uid: z.string().min(1),
  role: z.enum(['MANAGER', 'STAFF']),
});

export const disableAccountSchema = z.object({
  uid: z.string().min(1),
  disabled: z.boolean().default(true),
});

export type EnsureCustomerProfileInput = z.infer<typeof ensureCustomerProfileSchema>;
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type RecordLoginInput = z.infer<typeof recordLoginSchema>;
export type BootstrapOwnerInput = z.infer<typeof bootstrapOwnerSchema>;
export type SetStaffRoleInput = z.infer<typeof setStaffRoleSchema>;
export type DisableAccountInput = z.infer<typeof disableAccountSchema>;

export function isStaffRole(role: Role | string | null | undefined): role is StaffRole {
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

export function isCustomerRole(role: Role | string | null | undefined): boolean {
  return role === 'CUSTOMER';
}

/** OWNER and MANAGER may disable accounts (server still authoritative). */
export function canDisableAccounts(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/** Only OWNER may assign MANAGER / STAFF roles. */
export function canManageStaffRoles(role: Role | string | null | undefined): boolean {
  return role === 'OWNER';
}

/**
 * Progress helpers for a stamp combo. Server remains source of truth;
 * clients use these for display only.
 */
export function stampsRemaining(
  purchaseCount: number,
  requiredPurchases: number = DEFAULT_PURCHASES_REQUIRED,
): number {
  return Math.max(0, requiredPurchases - purchaseCount);
}

export function isRewardEligible(
  purchaseCount: number,
  requiredPurchases: number = DEFAULT_PURCHASES_REQUIRED,
): boolean {
  return purchaseCount >= requiredPurchases;
}

/** Generate an opaque QR token for customer counter lookup (Phase 4+). */
export function createQrToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
