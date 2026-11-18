import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_PURCHASES_REQUIRED, isRewardEligible, stampsRemaining } from './index';

describe('loyalty helpers', () => {
  it('computes remaining stamps', () => {
    assert.equal(stampsRemaining(3, 9), 6);
    assert.equal(stampsRemaining(9, 9), 0);
    assert.equal(stampsRemaining(10, 9), 0);
  });

  it('uses default N', () => {
    assert.equal(DEFAULT_PURCHASES_REQUIRED, 9);
    assert.equal(stampsRemaining(0), 9);
  });

  it('detects reward eligibility', () => {
    assert.equal(isRewardEligible(8, 9), false);
    assert.equal(isRewardEligible(9, 9), true);
  });
});
