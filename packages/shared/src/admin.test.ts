import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCreateStaffInvite,
  canViewActivityLogs,
  canViewReports,
  customerMatchesQuery,
  createStaffInviteSchema,
  listPurchasesSchema,
} from './index';

describe('admin RBAC helpers', () => {
  it('allows OWNER to invite MANAGER or STAFF', () => {
    assert.equal(canCreateStaffInvite('OWNER', 'MANAGER'), true);
    assert.equal(canCreateStaffInvite('OWNER', 'STAFF'), true);
  });

  it('allows MANAGER to invite STAFF only', () => {
    assert.equal(canCreateStaffInvite('MANAGER', 'STAFF'), true);
    assert.equal(canCreateStaffInvite('MANAGER', 'MANAGER'), false);
    assert.equal(canCreateStaffInvite('STAFF', 'STAFF'), false);
  });

  it('gates activity logs to OWNER/MANAGER', () => {
    assert.equal(canViewActivityLogs('OWNER'), true);
    assert.equal(canViewActivityLogs('MANAGER'), true);
    assert.equal(canViewActivityLogs('STAFF'), false);
  });

  it('gates reports nav to OWNER/MANAGER', () => {
    assert.equal(canViewReports('OWNER'), true);
    assert.equal(canViewReports('MANAGER'), true);
    assert.equal(canViewReports('STAFF'), false);
  });
});

describe('customer search', () => {
  it('matches name, phone digits, and email', () => {
    const customer = {
      displayName: 'Amina Coffee',
      phone: '+15550100200',
      email: 'amina@ramkin.local',
    };
    assert.equal(customerMatchesQuery(customer, 'amina'), true);
    assert.equal(customerMatchesQuery(customer, '0100'), true);
    assert.equal(customerMatchesQuery(customer, 'ramkin.local'), true);
    assert.equal(customerMatchesQuery(customer, 'zzz'), false);
  });
});

describe('admin schemas', () => {
  it('parses createStaffInvite', () => {
    const parsed = createStaffInviteSchema.parse({
      email: 'barista@ramkin.example',
      role: 'STAFF',
    });
    assert.equal(parsed.expiresInDays, 7);
  });

  it('parses listPurchases filters', () => {
    const parsed = listPurchasesSchema.parse({
      customerId: 'cust-1',
      from: '2026-01-01',
      limit: 20,
    });
    assert.equal(parsed.limit, 20);
  });
});
