import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  getCustomerDetailSchema,
  stampsRemaining,
  type ComboStatus,
  type CustomerDetailDto,
  type RewardRequestStatus,
  type UserStatus,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { toIso } from './time';

export const getCustomerDetail = onCall({ cors: true }, async (request) => {
  requireStaff(request);
  const input = getCustomerDetailSchema.parse(request.data ?? {});
  const db = getFirestore();

  const customerRef = db.collection('customers').doc(input.customerId);
  const [customerSnap, userSnap] = await Promise.all([
    customerRef.get(),
    db.collection('users').doc(input.customerId).get(),
  ]);

  if (!customerSnap.exists) {
    throw new HttpsError('not-found', 'Customer not found.');
  }

  const data = customerSnap.data()!;
  const user = userSnap.data();
  const comboId = (data.currentComboId as string | null | undefined) ?? null;

  let comboStatus: ComboStatus | null = null;
  let purchaseCount = 0;
  let requiredPurchases = 9;

  if (comboId) {
    const comboSnap = await db.collection('combos').doc(comboId).get();
    const combo = comboSnap.data();
    if (combo) {
      comboStatus = (combo.status as ComboStatus | undefined) ?? null;
      purchaseCount = typeof combo.purchaseCount === 'number' ? combo.purchaseCount : 0;
      requiredPurchases = typeof combo.requiredPurchases === 'number' ? combo.requiredPurchases : 9;
    }
  }

  const [purchasesSnap, rewardsSnap, combosSnap] = await Promise.all([
    db
      .collection('purchases')
      .where('customerId', '==', input.customerId)
      .orderBy('createdAt', 'desc')
      .limit(input.purchaseLimit)
      .get(),
    db
      .collection('rewardRequests')
      .where('customerId', '==', input.customerId)
      .orderBy('requestedAt', 'desc')
      .limit(40)
      .get(),
    db
      .collection('combos')
      .where('customerId', '==', input.customerId)
      .orderBy('startedAt', 'desc')
      .limit(20)
      .get(),
  ]);

  const detail: CustomerDetailDto = {
    customer: {
      customerId: input.customerId,
      displayName: String(data.displayName ?? ''),
      phone: (data.phone as string | null | undefined) ?? null,
      email: (user?.email as string | null | undefined) ?? null,
      status: ((user?.status as UserStatus | undefined) ?? 'active') as UserStatus,
      currentComboId: comboId,
      comboStatus,
      purchaseCount,
      requiredPurchases,
      remaining: stampsRemaining(purchaseCount, requiredPurchases),
      totalPurchases: typeof data.totalPurchases === 'number' ? data.totalPurchases : 0,
      totalRewardsRedeemed:
        typeof data.totalRewardsRedeemed === 'number' ? data.totalRewardsRedeemed : 0,
      createdAt: toIso(data.createdAt as Timestamp | undefined),
      qrToken: String(data.qrToken ?? ''),
    },
    purchases: purchasesSnap.docs.map((doc) => {
      const p = doc.data();
      return {
        purchaseId: doc.id,
        customerId: p.customerId as string,
        customerName: String(data.displayName ?? ''),
        customerPhone: (data.phone as string | null | undefined) ?? null,
        comboId: p.comboId as string,
        recordedBy: p.recordedBy as string,
        amount: typeof p.amount === 'number' ? p.amount : null,
        note: (p.note as string | null | undefined) ?? null,
        createdAt: toIso(p.createdAt as Timestamp | undefined),
      };
    }),
    rewards: rewardsSnap.docs.map((doc) => {
      const r = doc.data();
      return {
        requestId: doc.id,
        comboId: r.comboId as string,
        status: r.status as RewardRequestStatus,
        requestedAt: toIso(r.requestedAt as Timestamp | undefined),
        reviewedAt: toIso(r.reviewedAt as Timestamp | undefined),
        rejectedReason: (r.rejectedReason as string | null | undefined) ?? null,
        redeemedAt: toIso(r.redeemedAt as Timestamp | undefined),
      };
    }),
    combos: combosSnap.docs.map((doc) => {
      const c = doc.data();
      return {
        comboId: doc.id,
        status: c.status as ComboStatus,
        purchaseCount: typeof c.purchaseCount === 'number' ? c.purchaseCount : 0,
        requiredPurchases: typeof c.requiredPurchases === 'number' ? c.requiredPurchases : 9,
        startedAt: toIso(c.startedAt as Timestamp | undefined),
        completedAt: toIso(c.completedAt as Timestamp | undefined),
        redeemedAt: toIso(c.redeemedAt as Timestamp | undefined),
      };
    }),
  };

  return { ok: true as const, detail };
});
