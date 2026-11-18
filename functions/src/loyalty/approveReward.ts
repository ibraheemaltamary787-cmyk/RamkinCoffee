import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  applyApproveReward,
  approveRewardSchema,
  canApproveRewards,
  LoyaltyTransitionError,
  type ComboSnapshot,
  type RewardRequestSnapshot,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { ensureLoyaltySettingsDoc } from './settings';

export const approveReward = onCall({ cors: true }, async (request) => {
  const staff = requireStaff(request);
  const input = approveRewardSchema.parse(request.data ?? {});
  const db = getFirestore();
  const settings = await ensureLoyaltySettingsDoc(db);

  if (!canApproveRewards(staff.role, settings.staffCanApproveRewards)) {
    throw new HttpsError(
      'permission-denied',
      'MANAGER or OWNER required to approve rewards (or enable staff approvals in settings).',
    );
  }

  const rewardRef = db.collection('rewardRequests').doc(input.requestId);

  const result = await db.runTransaction(async (tx) => {
    const rewardSnap = await tx.get(rewardRef);
    if (!rewardSnap.exists) {
      throw new HttpsError('not-found', 'Reward request not found.');
    }
    const rewardData = rewardSnap.data()!;
    const comboRef = db.collection('combos').doc(rewardData.comboId);
    const comboSnap = await tx.get(comboRef);
    if (!comboSnap.exists) {
      throw new HttpsError('not-found', 'Combo not found.');
    }
    const comboData = comboSnap.data()!;

    const combo: ComboSnapshot = {
      id: comboRef.id,
      customerId: rewardData.customerId,
      requiredPurchases:
        typeof comboData.requiredPurchases === 'number' ? comboData.requiredPurchases : 9,
      purchaseCount: typeof comboData.purchaseCount === 'number' ? comboData.purchaseCount : 0,
      status: comboData.status,
      rewardRequestId: comboData.rewardRequestId ?? null,
    };
    const reward: RewardRequestSnapshot = {
      id: rewardRef.id,
      customerId: rewardData.customerId,
      comboId: rewardData.comboId,
      status: rewardData.status,
      rejectedReason: rewardData.rejectedReason ?? null,
    };

    let transition;
    try {
      transition = applyApproveReward(combo, reward);
    } catch (err) {
      if (err instanceof LoyaltyTransitionError) {
        throw new HttpsError('failed-precondition', err.message);
      }
      throw err;
    }

    tx.update(rewardRef, {
      status: transition.rewardStatus,
      reviewedBy: staff.uid,
      reviewedAt: FieldValue.serverTimestamp(),
    });
    tx.update(comboRef, {
      status: transition.comboStatus,
    });

    return {
      requestId: rewardRef.id,
      comboId: combo.id,
      customerId: combo.customerId,
      comboStatus: transition.comboStatus,
      rewardStatus: transition.rewardStatus,
      purchaseCount: combo.purchaseCount,
    };
  });

  await writeActivityLog({
    actorUid: staff.uid,
    actorRole: staff.role,
    action: ACTIVITY_ACTIONS.REWARD_APPROVED,
    entityType: 'rewardRequest',
    entityId: result.requestId,
    metadata: { comboId: result.comboId, customerId: result.customerId },
  });

  return { ok: true as const, ...result };
});
