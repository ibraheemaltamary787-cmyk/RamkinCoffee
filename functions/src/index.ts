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
    phase: 8,
  };
});

export { ensureCustomerProfile } from './auth/ensureCustomerProfile';
export { updateCustomerProfile } from './auth/updateCustomerProfile';
export { recordLogin } from './auth/recordLogin';
export { bootstrapOwner } from './auth/bootstrapOwner';
export { setStaffRole } from './auth/setStaffRole';
export { disableAccount } from './auth/disableAccount';

export { recordPurchase } from './loyalty/recordPurchase';
export { lookupCustomerByPhone, lookupCustomerByQr } from './loyalty/lookupCustomer';
export { rotateCustomerQr } from './loyalty/rotateCustomerQr';
export { requestReward } from './loyalty/requestReward';
export { approveReward } from './loyalty/approveReward';
export { rejectReward } from './loyalty/rejectReward';
export { redeemReward } from './loyalty/redeemReward';
export { getLoyaltyProgress } from './loyalty/getLoyaltyProgress';
export { updateLoyaltySettings, getLoyaltySettings } from './loyalty/updateLoyaltySettings';
export { listOpenRewards } from './loyalty/listOpenRewards';

export { getAdminStats } from './admin/getAdminStats';
export { listCustomers } from './admin/listCustomers';
export { getCustomerDetail } from './admin/getCustomerDetail';
export { listPurchases } from './admin/listPurchases';
export { listActivityLogs } from './admin/listActivityLogs';
export { listStaff } from './admin/listStaff';
export {
  createStaffInvite,
  listStaffInvites,
  cancelStaffInvite,
  acceptStaffInvite,
} from './admin/staffInvites';

export { exportReport } from './reports/exportReport';
export { APP_CHECK_SETUP_NOTES } from './security/appCheck';
