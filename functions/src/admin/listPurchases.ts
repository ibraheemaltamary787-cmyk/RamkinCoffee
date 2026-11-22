import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Query, type Timestamp } from 'firebase-admin/firestore';
import { listPurchasesSchema, type PurchaseListItemDto } from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { parseBoundary, toIso } from './time';

export const listPurchases = onCall({ cors: true }, async (request) => {
  requireStaff(request);
  const input = listPurchasesSchema.parse(request.data ?? {});
  const db = getFirestore();

  let query: Query = db.collection('purchases');

  // Prefer equality filters that have composite indexes. When both channel and
  // verificationStatus are set, query one in Firestore and filter the other in memory.
  if (input.customerId) {
    query = query.where('customerId', '==', input.customerId);
  } else if (input.recordedBy) {
    query = query.where('recordedBy', '==', input.recordedBy);
  } else if (input.channel) {
    query = query.where('channel', '==', input.channel);
  } else if (input.verificationStatus) {
    query = query.where('verificationStatus', '==', input.verificationStatus);
  }

  try {
    if (input.from) {
      query = query.where('createdAt', '>=', parseBoundary(input.from, false));
    }
    if (input.to) {
      query = query.where('createdAt', '<=', parseBoundary(input.to, true));
    }
  } catch (err) {
    throw new HttpsError(
      'invalid-argument',
      err instanceof Error ? err.message : 'Invalid date filter.',
    );
  }

  // Over-fetch slightly when a secondary equality filter is applied in memory.
  const secondaryFilter =
    Boolean(input.channel) && Boolean(input.verificationStatus) && !input.customerId && !input.recordedBy;
  const fetchLimit = secondaryFilter ? Math.min(100, input.limit * 3) : input.limit;
  query = query.orderBy('createdAt', 'desc').limit(fetchLimit);

  const snap = await query.get();
  const customerCache = new Map<string, { name: string | null; phone: string | null }>();

  const purchases: PurchaseListItemDto[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (input.channel && data.channel !== input.channel) continue;
    if (input.verificationStatus && data.verificationStatus !== input.verificationStatus) continue;
    if (purchases.length >= input.limit) break;
    const customerId = data.customerId as string;
    if (!customerCache.has(customerId)) {
      const customerSnap = await db.collection('customers').doc(customerId).get();
      const c = customerSnap.data();
      customerCache.set(customerId, {
        name: (c?.displayName as string | undefined) ?? null,
        phone: (c?.phone as string | null | undefined) ?? null,
      });
    }
    const customer = customerCache.get(customerId)!;
    purchases.push({
      purchaseId: doc.id,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      comboId: data.comboId as string,
      recordedBy: data.recordedBy as string,
      amount: typeof data.amount === 'number' ? data.amount : null,
      note: (data.note as string | null | undefined) ?? null,
      createdAt: toIso(data.createdAt as Timestamp | undefined),
      channel: (data.channel as PurchaseListItemDto['channel'] | undefined) ?? null,
      orderRef: (data.orderRef as string | null | undefined) ?? null,
      verificationStatus:
        (data.verificationStatus as PurchaseListItemDto['verificationStatus'] | undefined) ?? null,
      source: (data.source as PurchaseListItemDto['source'] | undefined) ?? null,
    });
  }

  return { ok: true as const, purchases };
});
