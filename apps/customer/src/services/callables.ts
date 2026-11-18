import { httpsCallable } from 'firebase/functions';
import type {
  CustomerProfileDto,
  EnsureCustomerProfileInput,
  LoyaltyProgressDto,
  RequestRewardInput,
  UpdateCustomerProfileInput,
} from '@ramkin/shared';
import { getFirebaseFunctions } from './firebase';

export async function callEnsureCustomerProfile(
  input: EnsureCustomerProfileInput = {},
): Promise<{
  ok: true;
  created: boolean;
  comboCreated?: boolean;
  profile: CustomerProfileDto;
  claimsRefreshRequired: boolean;
}> {
  const fn = httpsCallable<
    EnsureCustomerProfileInput,
    {
      ok: true;
      created: boolean;
      comboCreated?: boolean;
      profile: CustomerProfileDto;
      claimsRefreshRequired: boolean;
    }
  >(getFirebaseFunctions(), 'ensureCustomerProfile');
  const result = await fn(input);
  return result.data;
}

export async function callUpdateCustomerProfile(
  input: UpdateCustomerProfileInput,
): Promise<{ ok: true; profile: CustomerProfileDto }> {
  const fn = httpsCallable<UpdateCustomerProfileInput, { ok: true; profile: CustomerProfileDto }>(
    getFirebaseFunctions(),
    'updateCustomerProfile',
  );
  const result = await fn(input);
  return result.data;
}

export async function callRecordLogin(): Promise<void> {
  const fn = httpsCallable<{ client: 'customer' }, { ok: true }>(
    getFirebaseFunctions(),
    'recordLogin',
  );
  await fn({ client: 'customer' });
}

export async function callGetLoyaltyProgress(): Promise<{ ok: true; progress: LoyaltyProgressDto }> {
  const fn = httpsCallable<Record<string, never>, { ok: true; progress: LoyaltyProgressDto }>(
    getFirebaseFunctions(),
    'getLoyaltyProgress',
  );
  const result = await fn({});
  return result.data;
}

export async function callRequestReward(
  input: RequestRewardInput = {},
): Promise<{
  ok: true;
  requestId: string;
  comboId: string;
  comboStatus: string;
  rewardStatus: string;
  purchaseCount: number;
  requiredPurchases: number;
}> {
  const fn = httpsCallable<
    RequestRewardInput,
    {
      ok: true;
      requestId: string;
      comboId: string;
      comboStatus: string;
      rewardStatus: string;
      purchaseCount: number;
      requiredPurchases: number;
    }
  >(getFirebaseFunctions(), 'requestReward');
  const result = await fn(input);
  return result.data;
}
