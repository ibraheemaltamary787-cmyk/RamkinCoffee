import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BRAND } from '@ramkin/shared';

describe('functions foundation', () => {
  it('exposes brand constant via shared package', () => {
    assert.equal(BRAND.name, 'RAMKIN');
  });
});
