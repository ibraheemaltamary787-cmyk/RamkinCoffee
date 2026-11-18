import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CUSTOMER_EXPORT_COLUMNS,
  PURCHASE_EXPORT_COLUMNS,
  REWARD_EXPORT_COLUMNS,
  buildExportFileName,
  canExportReports,
  customerRowValues,
  exportReportSchema,
  purchaseRowValues,
  rewardRowValues,
} from './reports';

describe('report RBAC', () => {
  it('allows OWNER and MANAGER only', () => {
    assert.equal(canExportReports('OWNER'), true);
    assert.equal(canExportReports('MANAGER'), true);
    assert.equal(canExportReports('STAFF'), false);
    assert.equal(canExportReports('CUSTOMER'), false);
    assert.equal(canExportReports(null), false);
  });
});

describe('exportReportSchema', () => {
  it('defaults format and sheets', () => {
    const parsed = exportReportSchema.parse({});
    assert.equal(parsed.format, 'xlsx');
    assert.deepEqual(parsed.sheets, ['customers', 'purchases', 'rewards']);
    assert.equal(parsed.limit, 500);
  });

  it('accepts filters', () => {
    const parsed = exportReportSchema.parse({
      format: 'pdf',
      from: '2026-01-01',
      to: '2026-01-31',
      rewardStatus: 'approved',
      search: 'amina',
      sheets: ['purchases', 'rewards'],
      limit: 100,
    });
    assert.equal(parsed.format, 'pdf');
    assert.equal(parsed.rewardStatus, 'approved');
    assert.equal(parsed.sheets.length, 2);
  });

  it('rejects bad dates', () => {
    assert.throws(() => exportReportSchema.parse({ from: 'not-a-date' }));
  });
});

describe('export column headers', () => {
  it('uses human-readable headers', () => {
    assert.ok(CUSTOMER_EXPORT_COLUMNS.includes('Display Name'));
    assert.ok(PURCHASE_EXPORT_COLUMNS.includes('Recorded By'));
    assert.ok(REWARD_EXPORT_COLUMNS.includes('Rejected Reason'));
  });

  it('row helpers align with column counts', () => {
    assert.equal(
      customerRowValues({
        customerId: 'c1',
        displayName: 'A',
        phone: null,
        status: 'active',
        currentComboId: null,
        comboStatus: null,
        purchaseCount: 1,
        requiredPurchases: 9,
        totalPurchases: 1,
        totalRewardsRedeemed: 0,
        createdAt: null,
      }).length,
      CUSTOMER_EXPORT_COLUMNS.length,
    );
    assert.equal(
      purchaseRowValues({
        purchaseId: 'p1',
        customerId: 'c1',
        customerName: null,
        customerPhone: null,
        comboId: 'combo',
        recordedBy: 'staff',
        amount: null,
        note: null,
        createdAt: null,
      }).length,
      PURCHASE_EXPORT_COLUMNS.length,
    );
    assert.equal(
      rewardRowValues({
        requestId: 'r1',
        customerId: 'c1',
        customerName: null,
        customerPhone: null,
        comboId: 'combo',
        status: 'requested',
        requestedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectedReason: null,
        redeemedBy: null,
        redeemedAt: null,
      }).length,
      REWARD_EXPORT_COLUMNS.length,
    );
  });

  it('builds dated file names', () => {
    const d = new Date('2026-11-18T12:00:00.000Z');
    assert.equal(buildExportFileName('xlsx', d), 'ramkin-report-2026-11-18.xlsx');
    assert.equal(buildExportFileName('pdf', d), 'ramkin-summary-2026-11-18.pdf');
  });
});
