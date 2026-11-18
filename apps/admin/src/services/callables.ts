import { httpsCallable } from 'firebase/functions';
import type {
  ApproveRewardInput,
  BootstrapOwnerInput,
  CustomerLookupDto,
  DisableAccountInput,
  RecordPurchaseInput,
  RedeemRewardInput,
  RejectRewardInput,
  SetStaffRoleInput,
  UpdateLoyaltySettingsInput,
} from '@ramkin/shared';
import { getFirebaseFunctions } from './firebase';

export async function callRecordLogin(): Promise<void> {
  const fn = httpsCallable<{ client: 'admin' }, { ok: true }>(getFirebaseFunctions(), 'recordLogin');
  await fn({ client: 'admin' });
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

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `purchase-${crypto.randomUUID()}`;
  }
  return `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
