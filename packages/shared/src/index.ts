/** Shared types and constants for RAMKIN Coffee apps + Functions. */

export const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

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

export interface LoyaltySettings {
  purchasesRequired: number;
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
