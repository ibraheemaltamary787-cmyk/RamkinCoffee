import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  customerMatchesQuery,
  listCustomersSchema,
  stampsRemaining,
  type ComboStatus,
  type CustomerListItemDto,
  type UserStatus,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { toIso } from './time';

export const listCustomers = onCall({ cors: true }, async (request) => {
  requireStaff(request);
  const input = listCustomersSchema.parse(request.data ?? {});
  const db = getFirestore();

  // Fetch a bounded window; filter name/phone in memory for flexible search.
  const fetchLimit = input.query ? Math.min(300, Math.max(input.limit * 4, 100)) : input.limit;
  const snap = await db
    .collection('customers')
    .orderBy('createdAt', 'desc')
    .limit(fetchLimit)
    .get();

  const items: CustomerListItemDto[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (input.query && !customerMatchesQuery(data, input.query)) {
      continue;
    }

    const userSnap = await db.collection('users').doc(doc.id).get();
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
        requiredPurchases =
          typeof combo.requiredPurchases === 'number' ? combo.requiredPurchases : 9;
      }
    }

    items.push({
      customerId: doc.id,
      displayName: String(data.displayName ?? ''),
      phone: (data.phone as string | null | undefined) ?? null,
      email: (data.email as string | null | undefined) ?? null,
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
    });

    if (items.length >= input.limit) break;
  }

  return { ok: true as const, customers: items };
});
