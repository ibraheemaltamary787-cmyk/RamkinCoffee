import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canApproveRewards,
  canCreateStaffInvite,
  canDisableAccounts,
  canExportReports,
  canManageStaffRoles,
  canRecordPurchases,
  canRedeemRewards,
  canUpdateLoyaltySettings,
  canViewActivityLogs,
  canViewAdminStats,
  canViewReports,
  isCustomerRole,
  isStaffRole,
  type Role,
} from './index';

const ROLES: Role[] = ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'];

/** Architecture §4.2 capability matrix — server helpers must match. */
const EXPECTED: Record<
  string,
  Record<Role, boolean>
> = {
  recordPurchase: { OWNER: true, MANAGER: true, STAFF: true, CUSTOMER: false },
  redeemReward: { OWNER: true, MANAGER: true, STAFF: true, CUSTOMER: false },
  approveRewardDefault: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  approveRewardStaffFlag: { OWNER: true, MANAGER: true, STAFF: true, CUSTOMER: false },
  updateLoyaltyN: { OWNER: true, MANAGER: false, STAFF: false, CUSTOMER: false },
  exportReports: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  viewReports: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  viewActivity: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  viewAdminStats: { OWNER: true, MANAGER: true, STAFF: true, CUSTOMER: false },
  disableAccounts: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  manageStaffRoles: { OWNER: true, MANAGER: false, STAFF: false, CUSTOMER: false },
  inviteStaff: { OWNER: true, MANAGER: true, STAFF: false, CUSTOMER: false },
  inviteManager: { OWNER: true, MANAGER: false, STAFF: false, CUSTOMER: false },
  isStaff: { OWNER: true, MANAGER: true, STAFF: true, CUSTOMER: false },
  isCustomer: { OWNER: false, MANAGER: false, STAFF: false, CUSTOMER: true },
};

function check(
  name: keyof typeof EXPECTED,
  fn: (role: Role) => boolean,
): void {
  for (const role of ROLES) {
    assert.equal(
      fn(role),
      EXPECTED[name][role],
      `${name} for ${role}: expected ${EXPECTED[name][role]}`,
    );
  }
}

describe('Architecture RBAC capability matrix', () => {
  it('matches record / redeem / approve / settings / reports gates', () => {
    check('recordPurchase', (r) => canRecordPurchases(r));
    check('redeemReward', (r) => canRedeemRewards(r));
    check('approveRewardDefault', (r) => canApproveRewards(r, false));
    check('approveRewardStaffFlag', (r) => canApproveRewards(r, true));
    check('updateLoyaltyN', (r) => canUpdateLoyaltySettings(r));
    check('exportReports', (r) => canExportReports(r));
    check('viewReports', (r) => canViewReports(r));
    check('viewActivity', (r) => canViewActivityLogs(r));
    check('viewAdminStats', (r) => canViewAdminStats(r));
    check('disableAccounts', (r) => canDisableAccounts(r));
    check('manageStaffRoles', (r) => canManageStaffRoles(r));
    check('inviteStaff', (r) => canCreateStaffInvite(r, 'STAFF'));
    check('inviteManager', (r) => canCreateStaffInvite(r, 'MANAGER'));
    check('isStaff', (r) => isStaffRole(r));
    check('isCustomer', (r) => isCustomerRole(r));
  });

  it('treats null / unknown roles as denied for privileged actions', () => {
    assert.equal(canRecordPurchases(null), false);
    assert.equal(canExportReports(undefined), false);
    assert.equal(canApproveRewards('HACKER', true), false);
    assert.equal(canManageStaffRoles(''), false);
    assert.equal(isStaffRole(null), false);
  });
});
