import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import type { AdminStatsDto } from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { startOfToday } from './time';

async function countWhere(collection: string, field: string, value: string): Promise<number> {
  const snap = await getFirestore().collection(collection).where(field, '==', value).count().get();
  return snap.data().count;
}

export const getAdminStats = onCall({ cors: true }, async (request) => {
  requireStaff(request);
  const db = getFirestore();

  const [
    totalCustomers,
    totalPurchases,
    purchasesTodaySnap,
    combosActive,
    combosCompleted,
    rewardRequested,
    rewardApproved,
    rewardRejected,
    rewardRedeemed,
  ] = await Promise.all([
    db
      .collection('customers')
      .count()
      .get()
      .then((s) => s.data().count),
    db
      .collection('purchases')
      .count()
      .get()
      .then((s) => s.data().count),
    db
      .collection('purchases')
      .where('createdAt', '>=', startOfToday())
      .count()
      .get()
      .then((s) => s.data().count),
    countWhere('combos', 'status', 'active'),
    countWhere('combos', 'status', 'completed'),
    countWhere('rewardRequests', 'status', 'requested'),
    countWhere('rewardRequests', 'status', 'approved'),
    countWhere('rewardRequests', 'status', 'rejected'),
    countWhere('rewardRequests', 'status', 'redeemed'),
  ]);

  const stats: AdminStatsDto = {
    totalCustomers,
    totalPurchases,
    purchasesToday: purchasesTodaySnap,
    combosActive,
    combosCompleted,
    rewardRequested,
    rewardApproved,
    rewardRejected,
    rewardRedeemed,
  };

  return { ok: true as const, stats };
});
