import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canDisableAccounts, canManageStaffRoles, isStaffRole } from '@ramkin/shared';

/**
 * Lightweight capability matrix checks mirroring Functions claim gates.
 * Full callable integration needs Auth Emulator + deployed secrets.
 */
describe('Phase 3 capability matrix (shared gates)', () => {
  it('CUSTOMER cannot manage staff or disable accounts', () => {
    assert.equal(isStaffRole('CUSTOMER'), false);
    assert.equal(canDisableAccounts('CUSTOMER'), false);
    assert.equal(canManageStaffRoles('CUSTOMER'), false);
  });

  it('STAFF is staff but cannot disable or grant roles', () => {
    assert.equal(isStaffRole('STAFF'), true);
    assert.equal(canDisableAccounts('STAFF'), false);
    assert.equal(canManageStaffRoles('STAFF'), false);
  });

  it('MANAGER can disable but cannot grant staff roles', () => {
    assert.equal(canDisableAccounts('MANAGER'), true);
    assert.equal(canManageStaffRoles('MANAGER'), false);
  });

  it('OWNER can disable and grant staff roles', () => {
    assert.equal(canDisableAccounts('OWNER'), true);
    assert.equal(canManageStaffRoles('OWNER'), true);
  });
});
