import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyApproveReward,
  applyPurchaseToCombo,
  applyRedeemReward,
  applyRejectReward,
  applyRequestReward,
  canApproveRewards,
  canExportReports,
  canRecordPurchases,
  LoyaltyTransitionError,
  recordPurchaseSchema,
  rejectRewardSchema,
  simulateFullLoyaltyCycle,
  updateLoyaltySettingsSchema,
  type ComboSnapshot,
  type RewardRequestSnapshot,
} from '@ramkin/shared';

/**
 * Functions-side coverage of the loyalty state machine + input schemas.
 * Emulator E2E for callables still needs a live Firebase project.
 */
describe('loyalty engine (functions)', () => {
  it('rejects concurrent-style double stamp after completion', () => {
    const combo: ComboSnapshot = {
      id: 'c1',
      customerId: 'u1',
      requiredPurchases: 2,
      purchaseCount: 1,
      status: 'active',
      rewardRequestId: null,
    };
    const first = applyPurchaseToCombo(combo);
    assert.equal(first.status, 'completed');
    assert.throws(
      () =>
        applyPurchaseToCombo({
          ...combo,
          purchaseCount: first.purchaseCount,
          status: first.status,
        }),
      (err: unknown) => err instanceof LoyaltyTransitionError && err.code === 'combo_not_active',
    );
  });

  it('request → redeem path only resets on redeem', () => {
    const cycle = simulateFullLoyaltyCycle(2);
    assert.equal(cycle.stampsPreservedThroughApprove, true);
    assert.equal(cycle.afterRedeemOld, 'redeemed');
    assert.equal(cycle.afterRedeemNew, 'active');
  });

  it('validates recordPurchase idempotency keys', () => {
    const ok = recordPurchaseSchema.parse({
      customerId: 'cust',
      idempotencyKey: 'staff-abc-12345678',
    });
    assert.equal(ok.idempotencyKey, 'staff-abc-12345678');
    assert.throws(() =>
      recordPurchaseSchema.parse({ customerId: 'cust', idempotencyKey: 'short' }),
    );
  });

  it('does not allow redeem without approve', () => {
    const combo: ComboSnapshot = {
      id: 'c1',
      customerId: 'u1',
      requiredPurchases: 2,
      purchaseCount: 2,
      status: 'completed',
      rewardRequestId: null,
    };
    const requested = applyRequestReward(combo);
    assert.equal(requested.comboStatus, 'reward_pending');
    assert.throws(
      () =>
        applyRedeemReward(
          { ...combo, status: 'reward_pending', rewardRequestId: 'r1' },
          {
            id: 'r1',
            customerId: 'u1',
            comboId: 'c1',
            status: 'requested',
            rejectedReason: null,
          },
          2,
        ),
      (err: unknown) => err instanceof LoyaltyTransitionError && err.code === 'reward_not_approved',
    );
  });

  it('enforces staff approve gate and reject reason schema (callable preconditions)', () => {
    assert.equal(canRecordPurchases('CUSTOMER'), false);
    assert.equal(canApproveRewards('STAFF', false), false);
    assert.equal(canApproveRewards('STAFF', true), true);
    assert.equal(canExportReports('STAFF'), false);
    assert.throws(() => rejectRewardSchema.parse({ requestId: 'r1', reason: 'x' }));
    assert.equal(
      updateLoyaltySettingsSchema.parse({ purchasesRequired: 3 }).purchasesRequired,
      3,
    );
  });

  it('reject restores completed; approve then redeem opens a fresh combo', () => {
    const combo: ComboSnapshot = {
      id: 'c1',
      customerId: 'u1',
      requiredPurchases: 2,
      purchaseCount: 2,
      status: 'reward_pending',
      rewardRequestId: 'r1',
    };
    const reward: RewardRequestSnapshot = {
      id: 'r1',
      customerId: 'u1',
      comboId: 'c1',
      status: 'requested',
      rejectedReason: null,
    };
    const rejected = applyRejectReward(combo, reward);
    assert.equal(rejected.comboStatus, 'completed');
    assert.equal(rejected.clearRewardRequestId, true);

    const pending = applyRequestReward({
      ...combo,
      status: 'completed',
      rewardRequestId: null,
    });
    const approved = applyApproveReward(
      { ...combo, status: pending.comboStatus, rewardRequestId: 'r2' },
      { ...reward, id: 'r2', status: 'requested' },
    );
    const redeemed = applyRedeemReward(
      { ...combo, status: approved.comboStatus, rewardRequestId: 'r2' },
      { ...reward, id: 'r2', status: 'approved' },
      9,
    );
    assert.equal(redeemed.newCombo.status, 'active');
    assert.equal(redeemed.newCombo.requiredPurchases, 9);
    assert.equal(combo.purchaseCount, 2);
  });
});
