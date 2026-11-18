import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  applyRedeemReward,
  LoyaltyTransitionError,
  redeemRewardSchema,
  type ComboSnapshot,
  type RewardRequestSnapshot,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { ensureLoyaltySettingsDoc } from './settings';
import { createActiveComboInTx } from './combo';

export const redeemReward = onCall({ cors: true }, async (request) => {
  const staff = requireStaff(request);
  const input = redeemRewardSchema.parse(request.data ?? {});
  const db = getFirestore();
  const settings = await ensureLoyaltySettingsDoc(db);

  const rewardRef = db.collection('rewardRequests').doc(input.requestId);

  const result = await db.runTransaction(async (tx) => {
    const rewardSnap = await tx.get(rewardRef);
    if (!rewardSnap.exists) {
      throw new HttpsError('not-found', 'Reward request not found.');
    }
    const rewardData = rewardSnap.data()!;
    const customerId = rewardData.customerId as string;
    const comboRef = db.collection('combos').doc(rewardData.comboId);
    const customerRef = db.collection('customers').doc(customerId);

    const [comboSnap, customerSnap] = await Promise.all([tx.get(comboRef), tx.get(customerRef)]);
    if (!comboSnap.exists) {
      throw new HttpsError('not-found', 'Combo not found.');
    }
    if (!customerSnap.exists) {
      throw new HttpsError('not-found', 'Customer not found.');
    }

    const comboData = comboSnap.data()!;
    const combo: ComboSnapshot = {
      id: comboRef.id,
      customerId,
      requiredPurchases:
        typeof comboData.requiredPurchases === 'number' ? comboData.requiredPurchases : 9,
      purchaseCount: typeof comboData.purchaseCount === 'number' ? comboData.purchaseCount : 0,
      status: comboData.status,
      rewardRequestId: comboData.rewardRequestId ?? null,
    };
    const reward: RewardRequestSnapshot = {
      id: rewardRef.id,
      customerId,
      comboId: rewardData.comboId,
      status: rewardData.status,
      rejectedReason: rewardData.rejectedReason ?? null,
    };

    let transition;
    try {
      transition = applyRedeemReward(combo, reward, settings.purchasesRequired);
    } catch (err) {
      if (err instanceof LoyaltyTransitionError) {
        throw new HttpsError('failed-precondition', err.message);
      }
      throw err;
    }

    const now = FieldValue.serverTimestamp();

    tx.update(rewardRef, {
      status: transition.rewardStatus,
      redeemedBy: staff.uid,
      redeemedAt: now,
    });

    // Mark old combo redeemed — purchase history stays linked to this comboId.
    tx.update(comboRef, {
      status: transition.oldComboStatus,
      redeemedAt: now,
    });

    const { comboId: newComboId } = createActiveComboInTx(tx, db, {
      customerId,
      requiredPurchases: transition.newCombo.requiredPurchases,
    });

    tx.set(
      customerRef,
      {
        currentComboId: newComboId,
        totalRewardsRedeemed: FieldValue.increment(1),
      },
      { merge: true },
    );

    return {
      requestId: rewardRef.id,
      customerId,
      oldComboId: combo.id,
      newComboId,
      oldComboStatus: transition.oldComboStatus,
      rewardStatus: transition.rewardStatus,
      newRequiredPurchases: transition.newCombo.requiredPurchases,
    };
  });

  await writeActivityLog({
    actorUid: staff.uid,
    actorRole: staff.role,
    action: ACTIVITY_ACTIONS.REWARD_REDEEMED,
    entityType: 'rewardRequest',
    entityId: result.requestId,
    metadata: {
      customerId: result.customerId,
      oldComboId: result.oldComboId,
      newComboId: result.newComboId,
    },
  });

  return { ok: true as const, ...result };
});
