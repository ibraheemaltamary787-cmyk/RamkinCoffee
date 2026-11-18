import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import type { RewardRequestStatus } from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { buildProgressDto } from './progress';

export const getLoyaltyProgress = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  const db = getFirestore();

  // Staff may pass customerId; customers only see themselves.
  const requestedId =
    typeof request.data?.customerId === 'string' ? request.data.customerId : auth.uid;

  if (requestedId !== auth.uid) {
    if (auth.role !== 'OWNER' && auth.role !== 'MANAGER' && auth.role !== 'STAFF') {
      throw new HttpsError('permission-denied', 'Cannot view another customer’s progress.');
    }
  }

  const customerSnap = await db.collection('customers').doc(requestedId).get();
  if (!customerSnap.exists) {
    throw new HttpsError('not-found', 'Customer not found.');
  }
  const customer = customerSnap.data()!;
  const comboId = (customer.currentComboId as string | null | undefined) ?? null;

  let comboData = null;
  let openRewardStatus: RewardRequestStatus | null = null;
  if (comboId) {
    const comboSnap = await db.collection('combos').doc(comboId).get();
    if (comboSnap.exists) {
      comboData = comboSnap.data()!;
      const rewardId = comboData.rewardRequestId as string | null | undefined;
      if (rewardId) {
        const rewardSnap = await db.collection('rewardRequests').doc(rewardId).get();
        if (rewardSnap.exists) {
          openRewardStatus = rewardSnap.data()?.status as RewardRequestStatus;
        }
      }
    }
  }

  const progress = buildProgressDto({
    customerId: requestedId,
    customer,
    combo: comboData,
    comboId,
    openRewardStatus,
  });

  return { ok: true as const, progress };
});
