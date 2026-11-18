import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { ReportDataDto } from '@ramkin/shared';
import { buildExcelBuffer } from './buildExcel';
import { buildPdfBuffer } from './buildPdf';

const fixture: ReportDataDto = {
  summary: {
    generatedAt: '2026-11-18T12:00:00.000Z',
    from: '2026-11-01',
    to: '2026-11-18',
    rewardStatus: null,
    search: null,
    recordedBy: null,
    customerCount: 1,
    purchaseCount: 1,
    rewardCount: 1,
    rewardStatusCounts: { approved: 1 },
  },
  customers: [
    {
      customerId: 'cust-1',
      displayName: 'Amina',
      phone: '+15550100200',
      status: 'active',
      currentComboId: 'combo-1',
      comboStatus: 'active',
      purchaseCount: 3,
      requiredPurchases: 9,
      totalPurchases: 12,
      totalRewardsRedeemed: 1,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ],
  purchases: [
    {
      purchaseId: 'purch-1',
      customerId: 'cust-1',
      customerName: 'Amina',
      customerPhone: '+15550100200',
      comboId: 'combo-1',
      recordedBy: 'staff-1',
      amount: 4.5,
      note: null,
      createdAt: '2026-11-10T10:00:00.000Z',
    },
  ],
  rewards: [
    {
      requestId: 'rew-1',
      customerId: 'cust-1',
      customerName: 'Amina',
      customerPhone: '+15550100200',
      comboId: 'combo-0',
      status: 'approved',
      requestedAt: '2026-11-05T09:00:00.000Z',
      reviewedBy: 'mgr-1',
      reviewedAt: '2026-11-05T10:00:00.000Z',
      rejectedReason: null,
      redeemedBy: null,
      redeemedAt: null,
    },
  ],
};

describe('export builders', () => {
  it('builds a non-empty xlsx buffer with ZIP signature', async () => {
    const buf = await buildExcelBuffer(fixture, ['customers', 'purchases', 'rewards']);
    assert.ok(buf.length > 100);
    // XLSX is a ZIP archive.
    assert.equal(buf[0], 0x50);
    assert.equal(buf[1], 0x4b);
  });

  it('builds a PDF starting with %PDF and finds the official logo asset', async () => {
    const logo = path.join(__dirname, '..', '..', 'assets', 'brand', 'ramkin-logo.jpg');
    assert.equal(fs.existsSync(logo), true, 'official logo must be present for PDF branding');
    const buf = await buildPdfBuffer(fixture);
    assert.ok(buf.length > 100);
    assert.equal(buf.subarray(0, 4).toString('utf8'), '%PDF');
  });
});
