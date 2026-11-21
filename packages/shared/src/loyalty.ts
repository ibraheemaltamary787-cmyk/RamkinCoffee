/** Pure loyalty state machine + schemas for RAMKIN Phase 4. */

import { z } from 'zod';
import {
  COMBO_STATUSES,
  DEFAULT_PURCHASES_REQUIRED,
  REWARD_REQUEST_STATUSES,
  type ComboStatus,
  type RewardRequestStatus,
  type Role,
} from './constants';

export const OPEN_REWARD_STATUSES = ['requested', 'approved'] as const;
export type OpenRewardStatus = (typeof OPEN_REWARD_STATUSES)[number];

export interface LoyaltySettingsDoc {
  purchasesRequired: number;
  /** When false (default), only OWNER/MANAGER may approve/reject. */
  staffCanApproveRewards: boolean;
  updatedBy: string | null;
  updatedAt: unknown;
}

export interface ComboSnapshot {
  id: string;
  customerId: string;
  requiredPurchases: number;
  purchaseCount: number;
  status: ComboStatus;
  rewardRequestId: string | null;
}

export interface RewardRequestSnapshot {
  id: string;
  customerId: string;
  comboId: string;
  status: RewardRequestStatus;
  rejectedReason: string | null;
}

export interface LoyaltyProgressDto {
  customerId: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  qrToken: string;
  currentComboId: string | null;
  purchaseCount: number;
  requiredPurchases: number;
  remaining: number;
  comboStatus: ComboStatus | null;
  rewardEligible: boolean;
  openRewardRequestId: string | null;
  openRewardStatus: RewardRequestStatus | null;
  totalPurchases: number;
  totalRewardsRedeemed: number;
}

export interface CustomerLookupDto {
  customerId: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  qrToken: string;
  status: 'active' | 'disabled';
  currentComboId: string | null;
  purchaseCount: number;
  requiredPurchases: number;
  remaining: number;
  comboStatus: ComboStatus | null;
  rewardEligible: boolean;
  openRewardRequestId: string | null;
  openRewardStatus: RewardRequestStatus | null;
  totalPurchases: number;
  totalRewardsRedeemed: number;
}

export const recordPurchaseSchema = z.object({
  customerId: z.string().min(1),
  idempotencyKey: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/, 'idempotencyKey must be alphanumeric with ._-:'),
  amount: z.number().nonnegative().finite().nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
  clientRequestId: z.string().trim().max(128).nullable().optional(),
});

export const lookupCustomerByPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]+$/, 'Phone must be digits, optionally starting with +'),
});

export const lookupCustomerByQrSchema = z.object({
  qrToken: z.string().trim().min(16).max(64),
});

export const requestRewardSchema = z.object({
  comboId: z.string().min(1).optional(),
});

export const approveRewardSchema = z.object({
  requestId: z.string().min(1),
});

export const rejectRewardSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().min(3).max(280),
});

export const redeemRewardSchema = z.object({
  requestId: z.string().min(1),
});

export const updateLoyaltySettingsSchema = z.object({
  purchasesRequired: z.number().int().min(1).max(100).optional(),
  staffCanApproveRewards: z.boolean().optional(),
});

export type RecordPurchaseInput = z.infer<typeof recordPurchaseSchema>;
export type LookupCustomerByPhoneInput = z.infer<typeof lookupCustomerByPhoneSchema>;
export type LookupCustomerByQrInput = z.infer<typeof lookupCustomerByQrSchema>;
export type RequestRewardInput = z.infer<typeof requestRewardSchema>;
export type ApproveRewardInput = z.infer<typeof approveRewardSchema>;
export type RejectRewardInput = z.infer<typeof rejectRewardSchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
export type UpdateLoyaltySettingsInput = z.infer<typeof updateLoyaltySettingsSchema>;

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  return trimmed.replace(/\D/g, '');
}

export function defaultLoyaltySettings(): Pick<
  LoyaltySettingsDoc,
  'purchasesRequired' | 'staffCanApproveRewards'
> {
  return {
    purchasesRequired: DEFAULT_PURCHASES_REQUIRED,
    staffCanApproveRewards: false,
  };
}

/** OWNER always; MANAGER always; STAFF only when settings allow. */
export function canApproveRewards(
  role: Role | string | null | undefined,
  staffCanApproveRewards = false,
): boolean {
  if (role === 'OWNER' || role === 'MANAGER') return true;
  if (role === 'STAFF') return staffCanApproveRewards;
  return false;
}

export function canRecordPurchases(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

export function canRedeemRewards(role: Role | string | null | undefined): boolean {
  return canRecordPurchases(role);
}

export function canUpdateLoyaltySettings(role: Role | string | null | undefined): boolean {
  return role === 'OWNER';
}

export function isOpenRewardStatus(
  status: RewardRequestStatus | string | null | undefined,
): status is OpenRewardStatus {
  return status === 'requested' || status === 'approved';
}

export function assertComboStatus(status: string): ComboStatus {
  if ((COMBO_STATUSES as readonly string[]).includes(status)) {
    return status as ComboStatus;
  }
  throw new Error(`Invalid combo status: ${status}`);
}

export function assertRewardStatus(status: string): RewardRequestStatus {
  if ((REWARD_REQUEST_STATUSES as readonly string[]).includes(status)) {
    return status as RewardRequestStatus;
  }
  throw new Error(`Invalid reward status: ${status}`);
}

export type LoyaltyTransitionErrorCode =
  | 'combo_not_active'
  | 'combo_not_completed'
  | 'combo_not_pending'
  | 'combo_not_approved'
  | 'already_eligible'
  | 'duplicate_open_reward'
  | 'reward_not_requested'
  | 'reward_not_approved'
  | 'reward_mismatch'
  | 'customer_disabled';

export class LoyaltyTransitionError extends Error {
  readonly code: LoyaltyTransitionErrorCode;

  constructor(code: LoyaltyTransitionErrorCode, message: string) {
    super(message);
    this.name = 'LoyaltyTransitionError';
    this.code = code;
  }
}

export interface PurchaseTransitionResult {
  purchaseCount: number;
  status: ComboStatus;
  completed: boolean;
}

/**
 * Apply one stamp to an active combo. Does not reset or create reward requests.
 * Concurrent safety is the caller's responsibility (Firestore transaction).
 */
export function applyPurchaseToCombo(combo: ComboSnapshot): PurchaseTransitionResult {
  if (combo.status !== 'active') {
    throw new LoyaltyTransitionError(
      'combo_not_active',
      `Cannot record purchase on combo status "${combo.status}".`,
    );
  }
  if (combo.purchaseCount >= combo.requiredPurchases) {
    throw new LoyaltyTransitionError(
      'already_eligible',
      'Combo already reached required purchases; customer should request a reward.',
    );
  }

  const purchaseCount = combo.purchaseCount + 1;
  const completed = purchaseCount >= combo.requiredPurchases;
  return {
    purchaseCount,
    status: completed ? 'completed' : 'active',
    completed,
  };
}

export interface RequestRewardTransitionResult {
  comboStatus: ComboStatus;
  rewardStatus: RewardRequestStatus;
}

/** Customer requests reward when combo is completed. Does NOT reset stamps. */
export function applyRequestReward(combo: ComboSnapshot): RequestRewardTransitionResult {
  if (combo.status !== 'completed') {
    throw new LoyaltyTransitionError(
      'combo_not_completed',
      `Reward can only be requested when combo is completed (got "${combo.status}").`,
    );
  }
  if (combo.purchaseCount < combo.requiredPurchases) {
    throw new LoyaltyTransitionError('combo_not_completed', 'Not enough purchases for a reward.');
  }
  if (combo.rewardRequestId) {
    throw new LoyaltyTransitionError(
      'duplicate_open_reward',
      'An open reward request already exists for this combo.',
    );
  }
  return {
    comboStatus: 'reward_pending',
    rewardStatus: 'requested',
  };
}

export interface ApproveRewardTransitionResult {
  comboStatus: ComboStatus;
  rewardStatus: RewardRequestStatus;
}

/** Approve does NOT reset the combo. */
export function applyApproveReward(
  combo: ComboSnapshot,
  reward: RewardRequestSnapshot,
): ApproveRewardTransitionResult {
  if (reward.comboId !== combo.id) {
    throw new LoyaltyTransitionError('reward_mismatch', 'Reward does not belong to this combo.');
  }
  if (reward.status !== 'requested') {
    throw new LoyaltyTransitionError(
      'reward_not_requested',
      `Only requested rewards can be approved (got "${reward.status}").`,
    );
  }
  if (combo.status !== 'reward_pending') {
    throw new LoyaltyTransitionError(
      'combo_not_pending',
      `Combo must be reward_pending to approve (got "${combo.status}").`,
    );
  }
  return {
    comboStatus: 'reward_approved',
    rewardStatus: 'approved',
  };
}

export interface RejectRewardTransitionResult {
  comboStatus: ComboStatus;
  rewardStatus: RewardRequestStatus;
  /** After reject, combo returns to completed and may be re-requested. */
  clearRewardRequestId: boolean;
}

/** Reject does NOT reset stamps; allows re-request. */
export function applyRejectReward(
  combo: ComboSnapshot,
  reward: RewardRequestSnapshot,
): RejectRewardTransitionResult {
  if (reward.comboId !== combo.id) {
    throw new LoyaltyTransitionError('reward_mismatch', 'Reward does not belong to this combo.');
  }
  if (reward.status !== 'requested') {
    throw new LoyaltyTransitionError(
      'reward_not_requested',
      `Only requested rewards can be rejected (got "${reward.status}").`,
    );
  }
  if (combo.status !== 'reward_pending') {
    throw new LoyaltyTransitionError(
      'combo_not_pending',
      `Combo must be reward_pending to reject (got "${combo.status}").`,
    );
  }
  return {
    comboStatus: 'completed',
    rewardStatus: 'rejected',
    clearRewardRequestId: true,
  };
}

export interface RedeemRewardTransitionResult {
  oldComboStatus: ComboStatus;
  rewardStatus: RewardRequestStatus;
  /** New combo starts at zero — this is the ONLY reset path. */
  newCombo: {
    purchaseCount: 0;
    status: 'active';
    requiredPurchases: number;
  };
}

/**
 * Redeem confirms the free drink was given.
 * ONLY this transition marks the old combo redeemed and opens a fresh combo.
 */
export function applyRedeemReward(
  combo: ComboSnapshot,
  reward: RewardRequestSnapshot,
  nextRequiredPurchases: number,
): RedeemRewardTransitionResult {
  if (reward.comboId !== combo.id) {
    throw new LoyaltyTransitionError('reward_mismatch', 'Reward does not belong to this combo.');
  }
  if (reward.status !== 'approved') {
    throw new LoyaltyTransitionError(
      'reward_not_approved',
      `Only approved rewards can be redeemed (got "${reward.status}").`,
    );
  }
  if (combo.status !== 'reward_approved') {
    throw new LoyaltyTransitionError(
      'combo_not_approved',
      `Combo must be reward_approved to redeem (got "${combo.status}").`,
    );
  }
  if (nextRequiredPurchases < 1) {
    throw new Error('nextRequiredPurchases must be >= 1');
  }
  return {
    oldComboStatus: 'redeemed',
    rewardStatus: 'redeemed',
    newCombo: {
      purchaseCount: 0,
      status: 'active',
      requiredPurchases: nextRequiredPurchases,
    },
  };
}

/**
 * Simulate a full buy-N → request → approve → redeem cycle for demos/tests.
 * Returns the sequence of combo statuses after each milestone.
 */
export function simulateFullLoyaltyCycle(requiredPurchases: number = DEFAULT_PURCHASES_REQUIRED): {
  afterPurchases: ComboStatus;
  afterRequest: ComboStatus;
  afterApprove: ComboStatus;
  afterRedeemOld: ComboStatus;
  afterRedeemNew: ComboStatus;
  stampsPreservedThroughApprove: boolean;
} {
  let combo: ComboSnapshot = {
    id: 'combo-1',
    customerId: 'cust-1',
    requiredPurchases,
    purchaseCount: 0,
    status: 'active',
    rewardRequestId: null,
  };

  for (let i = 0; i < requiredPurchases; i += 1) {
    const next = applyPurchaseToCombo(combo);
    combo = { ...combo, purchaseCount: next.purchaseCount, status: next.status };
  }
  const afterPurchases = combo.status;
  const stampsAtComplete = combo.purchaseCount;

  const requested = applyRequestReward(combo);
  combo = {
    ...combo,
    status: requested.comboStatus,
    rewardRequestId: 'req-1',
  };
  const afterRequest = combo.status;
  const stampsAfterRequest = combo.purchaseCount;

  const reward: RewardRequestSnapshot = {
    id: 'req-1',
    customerId: combo.customerId,
    comboId: combo.id,
    status: 'requested',
    rejectedReason: null,
  };

  const approved = applyApproveReward(combo, reward);
  combo = { ...combo, status: approved.comboStatus };
  const afterApprove = combo.status;
  const stampsAfterApprove = combo.purchaseCount;

  const redeemed = applyRedeemReward(combo, { ...reward, status: 'approved' }, requiredPurchases);

  return {
    afterPurchases,
    afterRequest,
    afterApprove,
    afterRedeemOld: redeemed.oldComboStatus,
    afterRedeemNew: redeemed.newCombo.status,
    stampsPreservedThroughApprove:
      stampsAtComplete === stampsAfterRequest &&
      stampsAfterRequest === stampsAfterApprove &&
      stampsAfterApprove === requiredPurchases,
  };
}
