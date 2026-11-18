import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  applyRequestReward,
  LoyaltyTransitionError,
  requestRewardSchema,
  type ComboSnapshot,
} from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';

export const requestReward = onCall({ cors: true }, async (request) => {
  const auth = requireAuth(request);
  if (auth.role && auth.role !== 'CUSTOMER') {
    throw new HttpsError('permission-denied', 'Only customers can request rewards.');
  }

  const input = requestRewardSchema.parse(request.data ?? {});
  const db = getFirestore();
  const customerRef = db.collection('customers').doc(auth.uid);

  const result = await db.runTransaction(async (tx) => {
    const customerSnap = await tx.get(customerRef);
    if (!customerSnap.exists) {
      throw new HttpsError('not-found', 'Customer profile not found.');
    }
    const customer = customerSnap.data()!;
    const comboId = input.comboId ?? (customer.currentComboId as string | null | undefined) ?? null;
    if (!comboId) {
      throw new HttpsError('failed-precondition', 'No active combo to request a reward for.');
    }
    if (input.comboId && input.comboId !== customer.currentComboId) {
      throw new HttpsError(
        'failed-precondition',
        'Reward can only be requested for the current combo.',
      );
    }

    const comboRef = db.collection('combos').doc(comboId);
    const comboSnap = await tx.get(comboRef);
    if (!comboSnap.exists) {
      throw new HttpsError('not-found', 'Combo not found.');
    }
    const comboData = comboSnap.data()!;
    if (comboData.customerId !== auth.uid) {
      throw new HttpsError('permission-denied', 'Combo does not belong to this customer.');
    }

    const snapshot: ComboSnapshot = {
      id: comboId,
      customerId: auth.uid,
      requiredPurchases:
        typeof comboData.requiredPurchases === 'number' ? comboData.requiredPurchases : 9,
      purchaseCount: typeof comboData.purchaseCount === 'number' ? comboData.purchaseCount : 0,
      status: comboData.status,
      rewardRequestId: comboData.rewardRequestId ?? null,
    };

    let transition;
    try {
      transition = applyRequestReward(snapshot);
    } catch (err) {
      if (err instanceof LoyaltyTransitionError) {
        throw new HttpsError('failed-precondition', err.message);
      }
      throw err;
    }

    const rewardRef = db.collection('rewardRequests').doc();
    tx.set(rewardRef, {
      customerId: auth.uid,
      comboId,
      status: transition.rewardStatus,
      requestedAt: FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      rejectedReason: null,
      redeemedBy: null,
      redeemedAt: null,
    });

    tx.update(comboRef, {
      status: transition.comboStatus,
      rewardRequestId: rewardRef.id,
    });

    return {
      requestId: rewardRef.id,
      comboId,
      comboStatus: transition.comboStatus,
      rewardStatus: transition.rewardStatus,
      purchaseCount: snapshot.purchaseCount,
      requiredPurchases: snapshot.requiredPurchases,
    };
  });

  await writeActivityLog({
    actorUid: auth.uid,
    actorRole: auth.role ?? 'CUSTOMER',
    action: ACTIVITY_ACTIONS.REWARD_REQUESTED,
    entityType: 'rewardRequest',
    entityId: result.requestId,
    metadata: { comboId: result.comboId },
  });

  return { ok: true as const, ...result };
});
