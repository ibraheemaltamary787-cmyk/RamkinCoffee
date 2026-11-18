/** Base enums and brand constants (no circular imports). */

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
  PURCHASE_RECORDED: 'purchase.recorded',
  REWARD_REQUESTED: 'reward.requested',
  REWARD_APPROVED: 'reward.approved',
  REWARD_REJECTED: 'reward.rejected',
  REWARD_REDEEMED: 'reward.redeemed',
  LOYALTY_SETTINGS_UPDATED: 'settings.loyalty_updated',
  CUSTOMER_LOOKUP: 'customer.lookup',
  STAFF_INVITE_CREATED: 'staff.invite_created',
  STAFF_INVITE_CANCELLED: 'staff.invite_cancelled',
  STAFF_INVITE_ACCEPTED: 'staff.invite_accepted',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];
