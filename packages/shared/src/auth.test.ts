import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canDisableAccounts,
  canManageStaffRoles,
  createQrToken,
  ensureCustomerProfileSchema,
  isStaffRole,
  setStaffRoleSchema,
  updateCustomerProfileSchema,
} from './index';

describe('auth role helpers', () => {
  it('recognizes staff roles', () => {
    assert.equal(isStaffRole('OWNER'), true);
    assert.equal(isStaffRole('MANAGER'), true);
    assert.equal(isStaffRole('STAFF'), true);
    assert.equal(isStaffRole('CUSTOMER'), false);
  });

  it('gates disable and staff-management capabilities', () => {
    assert.equal(canDisableAccounts('OWNER'), true);
    assert.equal(canDisableAccounts('MANAGER'), true);
    assert.equal(canDisableAccounts('STAFF'), false);
    assert.equal(canManageStaffRoles('OWNER'), true);
    assert.equal(canManageStaffRoles('MANAGER'), false);
  });
});

describe('auth schemas', () => {
  it('accepts safe profile updates', () => {
    const parsed = updateCustomerProfileSchema.parse({ displayName: 'Ibraheem' });
    assert.equal(parsed.displayName, 'Ibraheem');
  });

  it('rejects empty display names', () => {
    assert.throws(() => updateCustomerProfileSchema.parse({ displayName: '  ' }));
  });

  it('allows optional displayName on ensureCustomerProfile', () => {
    assert.deepEqual(ensureCustomerProfileSchema.parse({}), {});
  });

  it('blocks OWNER assignment via setStaffRole schema', () => {
    assert.throws(() => setStaffRoleSchema.parse({ uid: 'u1', role: 'OWNER' }));
  });
});

describe('createQrToken', () => {
  it('returns a 32-char hex string', () => {
    const token = createQrToken();
    assert.match(token, /^[0-9a-f]{32}$/);
  });
});
