import { initializeApp } from 'firebase-admin/app';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { BRAND } from '@ramkin/shared';

initializeApp();

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/**
 * Phase 2 smoke callable — proves Functions deploy wiring.
 */
export const helloRamkin = onCall({ cors: true }, () => {
  return {
    ok: true as const,
    brand: BRAND.name,
    message: 'RAMKIN Cloud Functions foundation is live.',
    phase: 3,
  };
});

export { ensureCustomerProfile } from './auth/ensureCustomerProfile';
export { updateCustomerProfile } from './auth/updateCustomerProfile';
export { recordLogin } from './auth/recordLogin';
export { bootstrapOwner } from './auth/bootstrapOwner';
export { setStaffRole } from './auth/setStaffRole';
export { disableAccount } from './auth/disableAccount';
