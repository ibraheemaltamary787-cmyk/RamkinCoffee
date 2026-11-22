import { httpsCallable } from 'firebase/functions';
import type {
  AcceptStaffInviteInput,
  ActivityLogDto,
  AdminStatsDto,
  ApproveRewardInput,
  BootstrapOwnerInput,
  CancelStaffInviteInput,
  CreateStaffInviteInput,
  CustomerDetailDto,
  CustomerListItemDto,
  CustomerLookupDto,
  DevFakeOtpSignInInput,
  DevFakeOtpSignInResult,
  DisableAccountInput,
  ExportReportInput,
  RotateCustomerQrInput,
  ExportReportResult,
  GetCustomerDetailInput,
  ListActivityLogsInput,
  ListCustomersInput,
  ListPurchasesInput,
  ListStaffInput,
  ListStaffInvitesInput,
  PurchaseListItemDto,
  RecordPurchaseInput,
  RedeemRewardInput,
  RejectRewardInput,
  SetStaffRoleInput,
  StaffInviteDto,
  StaffMemberDto,
  UpdateLoyaltySettingsInput,
} from '@ramkin/shared';
import { getFirebaseFunctions } from './firebase';
import { isDevFakeOtpEnabled } from './devFakeOtp';

export async function callRecordLogin(): Promise<void> {
  const fn = httpsCallable<{ client: 'admin' }, { ok: true }>(
    getFirebaseFunctions(),
    'recordLogin',
  );
  await fn({ client: 'admin' });
}

/** DEV ONLY — Fake OTP 0000 for @ramkin.local / phone staff seeds. */
export async function callDevFakeOtpSignIn(
  input: DevFakeOtpSignInInput,
): Promise<DevFakeOtpSignInResult> {
  if (!isDevFakeOtpEnabled()) {
    throw new Error('Development Fake OTP is disabled in this build.');
  }
  const fn = httpsCallable<DevFakeOtpSignInInput, DevFakeOtpSignInResult>(
    getFirebaseFunctions(),
    'devFakeOtpSignIn',
  );
  return (await fn(input)).data;
}

export async function callBootstrapOwner(input: BootstrapOwnerInput) {
  const fn = httpsCallable<
    BootstrapOwnerInput,
    {
      ok: true;
      uid: string;
      role: 'OWNER';
      claimsRefreshRequired: boolean;
      message: string;
    }
  >(getFirebaseFunctions(), 'bootstrapOwner');
  return (await fn(input)).data;
}

export async function callSetStaffRole(input: SetStaffRoleInput) {
  const fn = httpsCallable<SetStaffRoleInput, { ok: true; uid: string; role: string }>(
    getFirebaseFunctions(),
    'setStaffRole',
  );
  return (await fn(input)).data;
}

export async function callDisableAccount(input: DisableAccountInput) {
  const fn = httpsCallable<
    DisableAccountInput,
    { ok: true; uid: string; status: 'active' | 'disabled' }
  >(getFirebaseFunctions(), 'disableAccount');
  return (await fn(input)).data;
}

export async function callRotateCustomerQr(input: RotateCustomerQrInput) {
  const fn = httpsCallable<
    RotateCustomerQrInput,
    { ok: true; customerId: string; qrToken: string }
  >(getFirebaseFunctions(), 'rotateCustomerQr');
  return (await fn(input)).data;
}

export async function callLookupByPhone(phone: string) {
  const fn = httpsCallable<{ phone: string }, { ok: true; customer: CustomerLookupDto }>(
    getFirebaseFunctions(),
    'lookupCustomerByPhone',
  );
  return (await fn({ phone })).data;
}

export async function callLookupByQr(qrToken: string) {
  const fn = httpsCallable<{ qrToken: string }, { ok: true; customer: CustomerLookupDto }>(
    getFirebaseFunctions(),
    'lookupCustomerByQr',
  );
  return (await fn({ qrToken })).data;
}

export async function callRecordPurchase(input: RecordPurchaseInput) {
  const fn = httpsCallable<
    RecordPurchaseInput,
    {
      ok: true;
      deduped: boolean;
      purchaseId: string;
      comboId: string;
      purchaseCount: number;
      requiredPurchases: number;
      comboStatus: string;
      completed: boolean;
      remaining: number;
    }
  >(getFirebaseFunctions(), 'recordPurchase');
  return (await fn(input)).data;
}

export async function callApproveReward(input: ApproveRewardInput) {
  const fn = httpsCallable(getFirebaseFunctions(), 'approveReward');
  return (await fn(input)).data as { ok: true; requestId: string; comboStatus: string };
}

export async function callRejectReward(input: RejectRewardInput) {
  const fn = httpsCallable(getFirebaseFunctions(), 'rejectReward');
  return (await fn(input)).data as { ok: true; requestId: string; reason: string };
}

export async function callRedeemReward(input: RedeemRewardInput) {
  const fn = httpsCallable(getFirebaseFunctions(), 'redeemReward');
  return (await fn(input)).data as {
    ok: true;
    requestId: string;
    newComboId: string;
    oldComboId: string;
  };
}

export async function callListOpenRewards(status?: 'requested' | 'approved') {
  const fn = httpsCallable<
    { status?: 'requested' | 'approved' },
    {
      ok: true;
      rewards: Array<{
        requestId: string;
        customerId: string;
        comboId: string;
        status: string;
        requestedAt: string | null;
        displayName: string | null;
        phone: string | null;
        email: string | null;
        purchaseCount: number;
        requiredPurchases: number;
      }>;
    }
  >(getFirebaseFunctions(), 'listOpenRewards');
  return (await fn(status ? { status } : {})).data;
}

export async function callGetLoyaltySettings() {
  const fn = httpsCallable<
    Record<string, never>,
    { ok: true; settings: { purchasesRequired: number; staffCanApproveRewards: boolean } }
  >(getFirebaseFunctions(), 'getLoyaltySettings');
  return (await fn({})).data;
}

export async function callUpdateLoyaltySettings(input: UpdateLoyaltySettingsInput) {
  const fn = httpsCallable(getFirebaseFunctions(), 'updateLoyaltySettings');
  return (await fn(input)).data as {
    ok: true;
    settings: { purchasesRequired: number; staffCanApproveRewards: boolean };
  };
}

export async function callGetAdminStats() {
  const fn = httpsCallable<Record<string, never>, { ok: true; stats: AdminStatsDto }>(
    getFirebaseFunctions(),
    'getAdminStats',
  );
  return (await fn({})).data;
}

export async function callListCustomers(input: ListCustomersInput = {}) {
  const fn = httpsCallable<ListCustomersInput, { ok: true; customers: CustomerListItemDto[] }>(
    getFirebaseFunctions(),
    'listCustomers',
  );
  return (await fn(input)).data;
}

export async function callGetCustomerDetail(input: GetCustomerDetailInput) {
  const fn = httpsCallable<GetCustomerDetailInput, { ok: true; detail: CustomerDetailDto }>(
    getFirebaseFunctions(),
    'getCustomerDetail',
  );
  return (await fn(input)).data;
}

export async function callListPurchases(input: ListPurchasesInput = {}) {
  const fn = httpsCallable<ListPurchasesInput, { ok: true; purchases: PurchaseListItemDto[] }>(
    getFirebaseFunctions(),
    'listPurchases',
  );
  return (await fn(input)).data;
}

export async function callListActivityLogs(input: ListActivityLogsInput = {}) {
  const fn = httpsCallable<ListActivityLogsInput, { ok: true; logs: ActivityLogDto[] }>(
    getFirebaseFunctions(),
    'listActivityLogs',
  );
  return (await fn(input)).data;
}

export async function callListStaff(input: ListStaffInput = {}) {
  const fn = httpsCallable<ListStaffInput, { ok: true; staff: StaffMemberDto[] }>(
    getFirebaseFunctions(),
    'listStaff',
  );
  return (await fn(input)).data;
}

export async function callCreateStaffInvite(input: CreateStaffInviteInput) {
  const fn = httpsCallable<CreateStaffInviteInput, { ok: true; invite: StaffInviteDto }>(
    getFirebaseFunctions(),
    'createStaffInvite',
  );
  return (await fn(input)).data;
}

export async function callListStaffInvites(input: ListStaffInvitesInput = {}) {
  const fn = httpsCallable<ListStaffInvitesInput, { ok: true; invites: StaffInviteDto[] }>(
    getFirebaseFunctions(),
    'listStaffInvites',
  );
  return (await fn(input)).data;
}

export async function callCancelStaffInvite(input: CancelStaffInviteInput) {
  const fn = httpsCallable<
    CancelStaffInviteInput,
    { ok: true; inviteId: string; status: 'cancelled' }
  >(getFirebaseFunctions(), 'cancelStaffInvite');
  return (await fn(input)).data;
}

export async function callAcceptStaffInvite(input: AcceptStaffInviteInput = {}) {
  const fn = httpsCallable<
    AcceptStaffInviteInput,
    { ok: true; inviteId: string; role: string; claimsRefreshRequired: boolean }
  >(getFirebaseFunctions(), 'acceptStaffInvite');
  return (await fn(input)).data;
}

export async function callExportReport(input: ExportReportInput = {}) {
  const fn = httpsCallable<ExportReportInput, ExportReportResult>(
    getFirebaseFunctions(),
    'exportReport',
  );
  return (await fn(input)).data;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `purchase-${crypto.randomUUID()}`;
  }
  return `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
