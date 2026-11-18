/** Phase 6 reporting / export schemas + column headers. */

import { z } from 'zod';
import { REWARD_REQUEST_STATUSES, type Role } from './constants';

/** Real Excel / print column headers — never invent cryptic keys as titles. */
export const CUSTOMER_EXPORT_COLUMNS = [
  'Customer ID',
  'Display Name',
  'Phone',
  'Status',
  'Current Combo ID',
  'Combo Status',
  'Stamps',
  'Required Purchases',
  'Total Purchases',
  'Total Rewards Redeemed',
  'Created At',
] as const;

export const PURCHASE_EXPORT_COLUMNS = [
  'Purchase ID',
  'Customer ID',
  'Customer Name',
  'Customer Phone',
  'Combo ID',
  'Recorded By',
  'Amount',
  'Note',
  'Created At',
] as const;

export const REWARD_EXPORT_COLUMNS = [
  'Request ID',
  'Customer ID',
  'Customer Name',
  'Customer Phone',
  'Combo ID',
  'Status',
  'Requested At',
  'Reviewed By',
  'Reviewed At',
  'Rejected Reason',
  'Redeemed By',
  'Redeemed At',
] as const;

export const REPORT_FORMATS = ['xlsx', 'pdf', 'json'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const REPORT_SHEETS = ['customers', 'purchases', 'rewards'] as const;
export type ReportSheet = (typeof REPORT_SHEETS)[number];

export interface ReportCustomerRow {
  customerId: string;
  displayName: string;
  phone: string | null;
  status: string;
  currentComboId: string | null;
  comboStatus: string | null;
  purchaseCount: number;
  requiredPurchases: number;
  totalPurchases: number;
  totalRewardsRedeemed: number;
  createdAt: string | null;
}

export interface ReportPurchaseRow {
  purchaseId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  comboId: string;
  recordedBy: string;
  amount: number | null;
  note: string | null;
  createdAt: string | null;
}

export interface ReportRewardRow {
  requestId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  comboId: string;
  status: string;
  requestedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectedReason: string | null;
  redeemedBy: string | null;
  redeemedAt: string | null;
}

export interface ReportSummaryDto {
  generatedAt: string;
  from: string | null;
  to: string | null;
  rewardStatus: string | null;
  search: string | null;
  recordedBy: string | null;
  customerCount: number;
  purchaseCount: number;
  rewardCount: number;
  rewardStatusCounts: Record<string, number>;
}

export interface ReportDataDto {
  summary: ReportSummaryDto;
  customers: ReportCustomerRow[];
  purchases: ReportPurchaseRow[];
  rewards: ReportRewardRow[];
}

export interface ExportReportFileDto {
  ok: true;
  format: 'xlsx' | 'pdf';
  fileName: string;
  mimeType: string;
  /** Base64-encoded file bytes for client download. */
  contentBase64: string;
  summary: ReportSummaryDto;
}

export interface ExportReportJsonDto {
  ok: true;
  format: 'json';
  data: ReportDataDto;
}

export type ExportReportResult = ExportReportFileDto | ExportReportJsonDto;

const isoDateOrDateTime = z
  .string()
  .trim()
  .min(10)
  .max(40)
  .regex(/^\d{4}-\d{2}-\d{2}/, 'must be an ISO date or datetime');

export const exportReportSchema = z.object({
  format: z.enum(REPORT_FORMATS).default('xlsx'),
  sheets: z
    .array(z.enum(REPORT_SHEETS))
    .min(1)
    .max(3)
    .optional()
    .default(['customers', 'purchases', 'rewards']),
  /** Inclusive ISO date (`YYYY-MM-DD`) or datetime. */
  from: isoDateOrDateTime.optional(),
  to: isoDateOrDateTime.optional(),
  rewardStatus: z.enum([...REWARD_REQUEST_STATUSES]).optional(),
  /** Customer name / phone search (customers + related rows). */
  search: z.string().trim().max(80).optional(),
  recordedBy: z.string().min(1).optional(),
  /** Soft cap per sheet to keep callable responses bounded. */
  limit: z.number().int().min(1).max(2000).optional().default(500),
});

export type ExportReportInput = z.input<typeof exportReportSchema>;
export type ExportReportParsed = z.output<typeof exportReportSchema>;

/** OWNER and MANAGER may export reports (Architecture §4.2). */
export function canExportReports(role: Role | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function buildExportFileName(
  format: 'xlsx' | 'pdf',
  generatedAt: Date = new Date(),
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return format === 'xlsx' ? `ramkin-report-${stamp}.xlsx` : `ramkin-summary-${stamp}.pdf`;
}

export function customerRowValues(row: ReportCustomerRow): (string | number)[] {
  return [
    row.customerId,
    row.displayName,
    row.phone ?? '',
    row.status,
    row.currentComboId ?? '',
    row.comboStatus ?? '',
    row.purchaseCount,
    row.requiredPurchases,
    row.totalPurchases,
    row.totalRewardsRedeemed,
    row.createdAt ?? '',
  ];
}

export function purchaseRowValues(row: ReportPurchaseRow): (string | number)[] {
  return [
    row.purchaseId,
    row.customerId,
    row.customerName ?? '',
    row.customerPhone ?? '',
    row.comboId,
    row.recordedBy,
    row.amount ?? '',
    row.note ?? '',
    row.createdAt ?? '',
  ];
}

export function rewardRowValues(row: ReportRewardRow): (string | number)[] {
  return [
    row.requestId,
    row.customerId,
    row.customerName ?? '',
    row.customerPhone ?? '',
    row.comboId,
    row.status,
    row.requestedAt ?? '',
    row.reviewedBy ?? '',
    row.reviewedAt ?? '',
    row.rejectedReason ?? '',
    row.redeemedBy ?? '',
    row.redeemedAt ?? '',
  ];
}
