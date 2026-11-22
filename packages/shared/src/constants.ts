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

/** Where the eligible purchase happened. */
export const PURCHASE_CHANNELS = ['online', 'in_store'] as const;
export type PurchaseChannel = (typeof PURCHASE_CHANNELS)[number];

/** Staff / system verification of an eligible purchase. */
export const VERIFICATION_STATUSES = ['verified', 'pending', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** How the purchase was ingested into RAMKIN. */
export const PURCHASE_SOURCES = ['counter', 'foodics_webhook'] as const;
export type PurchaseSource = (typeof PURCHASE_SOURCES)[number];

/** Official Foodics online menu (Order Online opens this; no API sync invented). */
export const FOODICS_MENU_URL = 'https://ramkin.foodics.online/menu/-289360';

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
  DEV_FAKE_OTP: 'auth.dev_fake_otp',
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
  REPORT_EXPORTED: 'report.exported',
  QR_ROTATED: 'customer.qr_rotated',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];
