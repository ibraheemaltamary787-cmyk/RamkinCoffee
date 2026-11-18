import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_PURCHASES_REQUIRED,
  applyApproveReward,
  applyPurchaseToCombo,
  applyRedeemReward,
  applyRejectReward,
  applyRequestReward,
  canApproveRewards,
  canRecordPurchases,
  canRedeemRewards,
  canUpdateLoyaltySettings,
  defaultLoyaltySettings,
  isRewardEligible,
  LoyaltyTransitionError,
  normalizePhone,
  progressPercent,
  simulateFullLoyaltyCycle,
  stampsRemaining,
  type ComboSnapshot,
  type RewardRequestSnapshot,
} from './index';

function makeCombo(overrides: Partial<ComboSnapshot> = {}): ComboSnapshot {
  return {
    id: 'combo-1',
    customerId: 'cust-1',
    requiredPurchases: 9,
    purchaseCount: 0,
    status: 'active',
    rewardRequestId: null,
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardRequestSnapshot> = {}): RewardRequestSnapshot {
  return {
    id: 'req-1',
    customerId: 'cust-1',
    comboId: 'combo-1',
    status: 'requested',
    rejectedReason: null,
    ...overrides,
  };
}

describe('loyalty helpers', () => {
  it('computes remaining stamps and progress', () => {
    assert.equal(stampsRemaining(3, 9), 6);
    assert.equal(stampsRemaining(9, 9), 0);
    assert.equal(stampsRemaining(10, 9), 0);
    assert.equal(DEFAULT_PURCHASES_REQUIRED, 9);
    assert.equal(stampsRemaining(0), 9);
    assert.equal(progressPercent(0, 9), 0);
    assert.equal(progressPercent(9, 9), 100);
    assert.equal(progressPercent(3, 9), 33);
  });

  it('detects reward eligibility', () => {
    assert.equal(isRewardEligible(8, 9), false);
    assert.equal(isRewardEligible(9, 9), true);
  });

  it('defaults settings singleton to buy-9', () => {
    assert.deepEqual(defaultLoyaltySettings(), {
      purchasesRequired: 9,
      staffCanApproveRewards: false,
    });
  });

  it('normalizes phone digits', () => {
    assert.equal(normalizePhone('+1 (555) 010-0200'), '+15550100200');
    assert.equal(normalizePhone('05550100200'), '05550100200');
  });
});

describe('loyalty capability matrix', () => {
  it('only staff roles record purchases / redeem', () => {
    assert.equal(canRecordPurchases('CUSTOMER'), false);
    assert.equal(canRecordPurchases('STAFF'), true);
    assert.equal(canRedeemRewards('MANAGER'), true);
    assert.equal(canRedeemRewards('CUSTOMER'), false);
  });

  it('approve gates respect staffCanApproveRewards', () => {
    assert.equal(canApproveRewards('OWNER'), true);
    assert.equal(canApproveRewards('MANAGER'), true);
    assert.equal(canApproveRewards('STAFF', false), false);
    assert.equal(canApproveRewards('STAFF', true), true);
    assert.equal(canApproveRewards('CUSTOMER', true), false);
  });

  it('only OWNER updates loyalty settings', () => {
    assert.equal(canUpdateLoyaltySettings('OWNER'), true);
    assert.equal(canUpdateLoyaltySettings('MANAGER'), false);
    assert.equal(canUpdateLoyaltySettings('STAFF'), false);
  });
});

describe('loyalty state machine', () => {
  it('records purchases until completed; never resets on stamp', () => {
    let combo = makeCombo({ requiredPurchases: 3 });
    const first = applyPurchaseToCombo(combo);
    assert.equal(first.purchaseCount, 1);
    assert.equal(first.status, 'active');
    combo = { ...combo, purchaseCount: first.purchaseCount, status: first.status };

    const second = applyPurchaseToCombo(combo);
    combo = { ...combo, purchaseCount: second.purchaseCount, status: second.status };
    assert.equal(second.status, 'active');

    const third = applyPurchaseToCombo(combo);
    assert.equal(third.purchaseCount, 3);
    assert.equal(third.completed, true);
    assert.equal(third.status, 'completed');
  });

  it('rejects purchase on non-active combo', () => {
    assert.throws(
      () => applyPurchaseToCombo(makeCombo({ status: 'completed', purchaseCount: 9 })),
      (err: unknown) => err instanceof LoyaltyTransitionError && err.code === 'combo_not_active',
    );
  });

  it('request does not clear stamps', () => {
    const combo = makeCombo({ purchaseCount: 9, status: 'completed' });
    const result = applyRequestReward(combo);
    assert.equal(result.comboStatus, 'reward_pending');
    assert.equal(result.rewardStatus, 'requested');
    assert.equal(combo.purchaseCount, 9);
  });

  it('blocks duplicate open reward requests', () => {
    assert.throws(
      () =>
        applyRequestReward(
          makeCombo({ purchaseCount: 9, status: 'completed', rewardRequestId: 'existing' }),
        ),
      (err: unknown) =>
        err instanceof LoyaltyTransitionError && err.code === 'duplicate_open_reward',
    );
  });

  it('approve does not clear stamps or reset combo', () => {
    const combo = makeCombo({
      purchaseCount: 9,
      status: 'reward_pending',
      rewardRequestId: 'req-1',
    });
    const result = applyApproveReward(combo, makeReward());
    assert.equal(result.comboStatus, 'reward_approved');
    assert.equal(result.rewardStatus, 'approved');
    assert.equal(combo.purchaseCount, 9);
  });

  it('reject returns combo to completed for re-request without resetting stamps', () => {
    const combo = makeCombo({
      purchaseCount: 9,
      status: 'reward_pending',
      rewardRequestId: 'req-1',
    });
    const result = applyRejectReward(combo, makeReward());
    assert.equal(result.comboStatus, 'completed');
    assert.equal(result.rewardStatus, 'rejected');
    assert.equal(result.clearRewardRequestId, true);
    assert.equal(combo.purchaseCount, 9);

    const again = applyRequestReward({
      ...combo,
      status: 'completed',
      rewardRequestId: null,
    });
    assert.equal(again.comboStatus, 'reward_pending');
  });

  it('redeem is the only reset — opens a new zero combo', () => {
    const combo = makeCombo({
      purchaseCount: 9,
      status: 'reward_approved',
      rewardRequestId: 'req-1',
    });
    const result = applyRedeemReward(combo, makeReward({ status: 'approved' }), 9);
    assert.equal(result.oldComboStatus, 'redeemed');
    assert.equal(result.rewardStatus, 'redeemed');
    assert.deepEqual(result.newCombo, {
      purchaseCount: 0,
      status: 'active',
      requiredPurchases: 9,
    });
    // Old combo snapshot unchanged in memory — history preserved by caller.
    assert.equal(combo.purchaseCount, 9);
  });

  it('blocks redeem before approve', () => {
    assert.throws(
      () =>
        applyRedeemReward(
          makeCombo({ purchaseCount: 9, status: 'reward_pending', rewardRequestId: 'req-1' }),
          makeReward({ status: 'requested' }),
          9,
        ),
      (err: unknown) => err instanceof LoyaltyTransitionError && err.code === 'reward_not_approved',
    );
  });

  it('full cycle preserves stamps through approve and resets only on redeem', () => {
    const cycle = simulateFullLoyaltyCycle(3);
    assert.equal(cycle.afterPurchases, 'completed');
    assert.equal(cycle.afterRequest, 'reward_pending');
    assert.equal(cycle.afterApprove, 'reward_approved');
    assert.equal(cycle.afterRedeemOld, 'redeemed');
    assert.equal(cycle.afterRedeemNew, 'active');
    assert.equal(cycle.stampsPreservedThroughApprove, true);
  });

  it('default N cycle uses purchasesRequired = 9', () => {
    const cycle = simulateFullLoyaltyCycle();
    assert.equal(cycle.afterPurchases, 'completed');
    assert.equal(cycle.stampsPreservedThroughApprove, true);
  });
});
