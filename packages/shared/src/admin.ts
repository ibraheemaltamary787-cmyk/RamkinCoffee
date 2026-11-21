/** Phase 5 admin/staff product surface schemas + DTOs. */

import { z } from 'zod';
import {
  COMBO_STATUSES,
  REWARD_REQUEST_STATUSES,
  type ComboStatus,
  type RewardRequestStatus,
  type Role,
  type UserStatus,
} from './constants';

export const STAFF_INVITE_STATUSES = ['pending', 'accepted', 'cancelled', 'expired'] as const;
export type StaffInviteStatus = (typeof STAFF_INVITE_STATUSES)[number];

export interface AdminStatsDto {
  totalCustomers: number;
  totalPurchases: number;
  purchasesToday: number;
  combosActive: number;
  combosCompleted: number;
  rewardRequested: number;
  rewardApproved: number;
  rewardRejected: number;
  rewardRedeemed: number;
}

export interface CustomerListItemDto {
  customerId: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  status: UserStatus;
  currentComboId: string | null;
  comboStatus: ComboStatus | null;
  purchaseCount: number;
  requiredPurchases: number;
  remaining: number;
  totalPurchases: number;
  totalRewardsRedeemed: number;
  createdAt: string | null;
}

export interface PurchaseListItemDto {
  purchaseId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  comboId: string;
  recordedBy: string;
  amount: number | null;
  note: string | null;
  createdAt: string | null;
}

export interface CustomerDetailDto {
  customer: CustomerListItemDto & {
    qrToken: string;
    email: string | null;
  };
  purchases: PurchaseListItemDto[];
  rewards: Array<{
    requestId: string;
    comboId: string;
    status: RewardRequestStatus;
    requestedAt: string | null;
    reviewedAt: string | null;
    rejectedReason: string | null;
    redeemedAt: string | null;
  }>;
  combos: Array<{
    comboId: string;
    status: ComboStatus;
    purchaseCount: number;
    requiredPurchases: number;
    startedAt: string | null;
    completedAt: string | null;
    redeemedAt: string | null;
  }>;
}

export interface StaffMemberDto {
  uid: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface StaffInviteDto {
  inviteId: string;
  email: string;
  role: 'MANAGER' | 'STAFF';
  status: StaffInviteStatus;
  createdBy: string;
  createdAt: string | null;
  expiresAt: string | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
}

export interface ActivityLogDto {
  logId: string;
  actorUid: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export const listCustomersSchema = z.object({
  query: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const getCustomerDetailSchema = z.object({
  customerId: z.string().min(1),
  purchaseLimit: z.number().int().min(1).max(100).optional().default(40),
});

export const listPurchasesSchema = z.object({
  customerId: z.string().min(1).optional(),
  recordedBy: z.string().min(1).optional(),
  /** Inclusive ISO date (`YYYY-MM-DD`) or datetime string. */
  from: z
    .string()
    .trim()
    .min(10)
    .max(40)
    .regex(/^\d{4}-\d{2}-\d{2}/, 'from must be an ISO date or datetime')
    .optional(),
  to: z
    .string()
    .trim()
    .min(10)
    .max(40)
    .regex(/^\d{4}-\d{2}-\d{2}/, 'to must be an ISO date or datetime')
    .optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const listActivityLogsSchema = z.object({
  actorUid: z.string().min(1).optional(),
  action: z.string().trim().min(1).max(80).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const listStaffSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const createStaffInviteSchema = z.object({
  email: z.string().trim().email().max(120),
  role: z.enum(['MANAGER', 'STAFF']),
  /** Days until expiry; default 7. */
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
});

export const listStaffInvitesSchema = z.object({
  status: z.enum(['pending', 'accepted', 'cancelled', 'expired']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const cancelStaffInviteSchema = z.object({
  inviteId: z.string().min(1),
});

export const acceptStaffInviteSchema = z.object({
  inviteId: z.string().min(1).optional(),
});

export const listRewardRequestsSchema = z.object({
  status: z.enum([...REWARD_REQUEST_STATUSES]).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

/** Client/callable argument shapes (defaults applied by Zod `.parse` on the server). */
export type ListCustomersInput = z.input<typeof listCustomersSchema>;
export type GetCustomerDetailInput = z.input<typeof getCustomerDetailSchema>;
export type ListPurchasesInput = z.input<typeof listPurchasesSchema>;
export type ListActivityLogsInput = z.input<typeof listActivityLogsSchema>;
export type ListStaffInput = z.input<typeof listStaffSchema>;
export type CreateStaffInviteInput = z.input<typeof createStaffInviteSchema>;
export type ListStaffInvitesInput = z.input<typeof listStaffInvitesSchema>;
export type CancelStaffInviteInput = z.input<typeof cancelStaffInviteSchema>;
export type AcceptStaffInviteInput = z.input<typeof acceptStaffInviteSchema>;
export type ListRewardRequestsInput = z.input<typeof listRewardRequestsSchema>;

/** OWNER invites MANAGER/STAFF; MANAGER may invite STAFF only. */
export function canCreateStaffInvite(
  actorRole: Role | string | null | undefined,
  inviteRole: 'MANAGER' | 'STAFF',
): boolean {
  if (actorRole === 'OWNER') return true;
  if (actorRole === 'MANAGER' && inviteRole === 'STAFF') return true;
  return false;
}

export function canViewActivityLogs(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewAdminStats(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

/** Reports nav / export UX gate (server still authoritative via `canExportReports`). */
export function canViewReports(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function customerMatchesQuery(
  customer: { displayName?: string | null; phone?: string | null; email?: string | null },
  query: string,
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  const name = (customer.displayName ?? '').toLowerCase();
  const phone = (customer.phone ?? '').toLowerCase();
  const email = (customer.email ?? '').toLowerCase();
  const phoneDigits = phone.replace(/\D/g, '');
  const qDigits = q.replace(/\D/g, '');
  return (
    name.includes(q) ||
    email.includes(q) ||
    phone.includes(q) ||
    (qDigits.length > 0 && phoneDigits.includes(qDigits))
  );
}

export function isComboStatus(value: string): value is ComboStatus {
  return (COMBO_STATUSES as readonly string[]).includes(value);
}

export function isRewardRequestStatus(value: string): value is RewardRequestStatus {
  return (REWARD_REQUEST_STATUSES as readonly string[]).includes(value);
}
