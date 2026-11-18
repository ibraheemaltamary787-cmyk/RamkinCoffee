import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyPurchaseToCombo,
  applyRedeemReward,
  applyRequestReward,
  LoyaltyTransitionError,
  recordPurchaseSchema,
  simulateFullLoyaltyCycle,
  type ComboSnapshot,
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
      (err: unknown) =>
        err instanceof LoyaltyTransitionError && err.code === 'reward_not_approved',
    );
  });
});
