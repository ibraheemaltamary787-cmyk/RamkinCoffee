import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { requireStaff } from '../auth/claims';

function toIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== 'function') return null;
  return value.toDate().toISOString();
}

export const listOpenRewards = onCall({ cors: true }, async (request) => {
  requireStaff(request);
  const statusFilter =
    request.data?.status === 'approved' || request.data?.status === 'requested'
      ? request.data.status
      : null;

  const db = getFirestore();
  const statuses = statusFilter ? [statusFilter] : ['requested', 'approved'];

  const results: Array<{
    requestId: string;
    customerId: string;
    comboId: string;
    status: string;
    requestedAt: string | null;
    displayName: string | null;
    phone: string | null;
    purchaseCount: number;
    requiredPurchases: number;
  }> = [];

  for (const status of statuses) {
    const snap = await db
      .collection('rewardRequests')
      .where('status', '==', status)
      .orderBy('requestedAt', 'desc')
      .limit(50)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const [customerSnap, comboSnap] = await Promise.all([
        db.collection('customers').doc(data.customerId).get(),
        db.collection('combos').doc(data.comboId).get(),
      ]);
      const customer = customerSnap.data();
      const combo = comboSnap.data();
      results.push({
        requestId: doc.id,
        customerId: data.customerId,
        comboId: data.comboId,
        status: data.status,
        requestedAt: toIso(data.requestedAt),
        displayName: (customer?.displayName as string | undefined) ?? null,
        phone: (customer?.phone as string | null | undefined) ?? null,
        purchaseCount: typeof combo?.purchaseCount === 'number' ? combo.purchaseCount : 0,
        requiredPurchases:
          typeof combo?.requiredPurchases === 'number' ? combo.requiredPurchases : 9,
      });
    }
  }

  results.sort((a, b) => {
    const aTime = a.requestedAt ?? '';
    const bTime = b.requestedAt ?? '';
    return bTime.localeCompare(aTime);
  });

  return { ok: true as const, rewards: results };
});
