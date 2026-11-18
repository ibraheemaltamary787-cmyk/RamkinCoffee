import { httpsCallable } from 'firebase/functions';
import type { CustomerProfileDto, EnsureCustomerProfileInput, UpdateCustomerProfileInput } from '@ramkin/shared';
import { getFirebaseFunctions } from './firebase';

export async function callEnsureCustomerProfile(
  input: EnsureCustomerProfileInput = {},
): Promise<{ ok: true; created: boolean; profile: CustomerProfileDto; claimsRefreshRequired: boolean }> {
  const fn = httpsCallable<EnsureCustomerProfileInput, {
    ok: true;
    created: boolean;
    profile: CustomerProfileDto;
    claimsRefreshRequired: boolean;
  }>(getFirebaseFunctions(), 'ensureCustomerProfile');
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
