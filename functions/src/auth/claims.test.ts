import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canApproveRewards,
  canDisableAccounts,
  canExportReports,
  canManageStaffRoles,
  canRecordPurchases,
  canUpdateLoyaltySettings,
  isStaffRole,
} from '@ramkin/shared';

/**
 * Capability matrix checks mirroring Functions claim gates.
 * Full callable integration needs Auth Emulator + deployed secrets (Phase 7 blocked).
 */
describe('Functions claim-gate mirrors (shared)', () => {
  it('CUSTOMER cannot manage staff, stamp, export, or disable accounts', () => {
    assert.equal(isStaffRole('CUSTOMER'), false);
    assert.equal(canDisableAccounts('CUSTOMER'), false);
    assert.equal(canManageStaffRoles('CUSTOMER'), false);
    assert.equal(canRecordPurchases('CUSTOMER'), false);
    assert.equal(canExportReports('CUSTOMER'), false);
    assert.equal(canApproveRewards('CUSTOMER', true), false);
  });

  it('STAFF is staff but cannot disable, grant roles, export, or change N', () => {
    assert.equal(isStaffRole('STAFF'), true);
    assert.equal(canRecordPurchases('STAFF'), true);
    assert.equal(canDisableAccounts('STAFF'), false);
    assert.equal(canManageStaffRoles('STAFF'), false);
    assert.equal(canExportReports('STAFF'), false);
    assert.equal(canUpdateLoyaltySettings('STAFF'), false);
    assert.equal(canApproveRewards('STAFF', false), false);
    assert.equal(canApproveRewards('STAFF', true), true);
  });

  it('MANAGER can disable + export but cannot grant staff roles or change N', () => {
    assert.equal(canDisableAccounts('MANAGER'), true);
    assert.equal(canExportReports('MANAGER'), true);
    assert.equal(canManageStaffRoles('MANAGER'), false);
    assert.equal(canUpdateLoyaltySettings('MANAGER'), false);
    assert.equal(canApproveRewards('MANAGER', false), true);
  });

  it('OWNER can disable, grant roles, export, and change N', () => {
    assert.equal(canDisableAccounts('OWNER'), true);
    assert.equal(canManageStaffRoles('OWNER'), true);
    assert.equal(canExportReports('OWNER'), true);
    assert.equal(canUpdateLoyaltySettings('OWNER'), true);
  });
});
