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

  if (input.customerId) {
    query = query.where('customerId', '==', input.customerId);
  } else if (input.recordedBy) {
    query = query.where('recordedBy', '==', input.recordedBy);
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

  query = query.orderBy('createdAt', 'desc').limit(input.limit);

  const snap = await query.get();
  const customerCache = new Map<string, { name: string | null; phone: string | null }>();

  const purchases: PurchaseListItemDto[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
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
    });
  }

  return { ok: true as const, purchases };
});
