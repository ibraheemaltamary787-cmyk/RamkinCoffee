import { httpsCallable } from 'firebase/functions';
import type { BootstrapOwnerInput, DisableAccountInput, SetStaffRoleInput } from '@ramkin/shared';
import { getFirebaseFunctions } from './firebase';

export async function callRecordLogin(): Promise<void> {
  const fn = httpsCallable<{ client: 'admin' }, { ok: true }>(getFirebaseFunctions(), 'recordLogin');
  await fn({ client: 'admin' });
}

export async function callBootstrapOwner(input: BootstrapOwnerInput) {
  const fn = httpsCallable<BootstrapOwnerInput, {
    ok: true;
    uid: string;
    role: 'OWNER';
    claimsRefreshRequired: boolean;
    message: string;
  }>(getFirebaseFunctions(), 'bootstrapOwner');
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
