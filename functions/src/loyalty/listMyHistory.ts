import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import {
  listMyHistorySchema,
  type MyPurchaseDto,
  type MyRewardRequestDto,
  type RewardRequestStatus,
} from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { toIso } from '../admin/time';

/**
 * Customer-only: list own purchases (newest first).
 * Staff must use admin listPurchases.
 */
export const listMyPurchases = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  if (auth.role === 'OWNER' || auth.role === 'MANAGER' || auth.role === 'STAFF') {
    throw new HttpsError(
      'failed-precondition',
      'Staff must use the admin purchases list, not customer history.',
    );
  }

  const input = listMyHistorySchema.parse(request.data ?? {});
  const db = getFirestore();
  const snap = await db
    .collection('purchases')
    .where('customerId', '==', auth.uid)
    .orderBy('createdAt', 'desc')
    .limit(input.limit)
    .get();

  const purchases: MyPurchaseDto[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      purchaseId: doc.id,
      comboId: data.comboId as string,
      amount: typeof data.amount === 'number' ? data.amount : null,
      note: (data.note as string | null | undefined) ?? null,
      createdAt: toIso(data.createdAt as Timestamp | undefined),
    };
  });

  return { ok: true as const, purchases };
});

/**
 * Customer-only: list own reward requests (newest first).
 */
export const listMyRewardRequests = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  if (auth.role === 'OWNER' || auth.role === 'MANAGER' || auth.role === 'STAFF') {
    throw new HttpsError(
      'failed-precondition',
      'Staff must use the admin rewards queue, not customer history.',
    );
  }

  const input = listMyHistorySchema.parse(request.data ?? {});
  const db = getFirestore();
  const snap = await db
    .collection('rewardRequests')
    .where('customerId', '==', auth.uid)
    .orderBy('requestedAt', 'desc')
    .limit(input.limit)
    .get();

  const requests: MyRewardRequestDto[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      requestId: doc.id,
      comboId: data.comboId as string,
      status: data.status as RewardRequestStatus,
      rejectedReason: (data.rejectedReason as string | null | undefined) ?? null,
      requestedAt: toIso(data.requestedAt as Timestamp | undefined),
      reviewedAt: toIso(data.reviewedAt as Timestamp | undefined),
      redeemedAt: toIso(data.redeemedAt as Timestamp | undefined),
    };
  });

  return { ok: true as const, requests };
});
