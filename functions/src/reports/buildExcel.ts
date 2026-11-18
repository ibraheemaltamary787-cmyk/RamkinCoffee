import ExcelJS from 'exceljs';
import {
  CUSTOMER_EXPORT_COLUMNS,
  PURCHASE_EXPORT_COLUMNS,
  REWARD_EXPORT_COLUMNS,
  customerRowValues,
  purchaseRowValues,
  rewardRowValues,
  type ReportDataDto,
  type ReportSheet,
} from '@ramkin/shared';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0A0A0A' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFC9A962' },
  name: 'Calibri',
  size: 11,
};

function styleHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 20;
}

export async function buildExcelBuffer(
  data: ReportDataDto,
  sheets: ReportSheet[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RAMKIN Coffee';
  workbook.created = new Date(data.summary.generatedAt);

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['RAMKIN Coffee — Loyalty Report']);
  summarySheet.addRow(['Generated At', data.summary.generatedAt]);
  summarySheet.addRow(['From', data.summary.from ?? '—']);
  summarySheet.addRow(['To', data.summary.to ?? '—']);
  summarySheet.addRow(['Search', data.summary.search ?? '—']);
  summarySheet.addRow(['Recorded By', data.summary.recordedBy ?? '—']);
  summarySheet.addRow(['Reward Status Filter', data.summary.rewardStatus ?? '—']);
  summarySheet.addRow(['Customers', data.summary.customerCount]);
  summarySheet.addRow(['Purchases', data.summary.purchaseCount]);
  summarySheet.addRow(['Reward Requests', data.summary.rewardCount]);
  summarySheet.getColumn(1).width = 24;
  summarySheet.getColumn(2).width = 40;
  summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFC9A962' } };

  if (sheets.includes('customers')) {
    const sheet = workbook.addWorksheet('Customers');
    const header = sheet.addRow([...CUSTOMER_EXPORT_COLUMNS]);
    styleHeader(header);
    for (const row of data.customers) {
      sheet.addRow(customerRowValues(row));
    }
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
  }

  if (sheets.includes('purchases')) {
    const sheet = workbook.addWorksheet('Purchases');
    const header = sheet.addRow([...PURCHASE_EXPORT_COLUMNS]);
    styleHeader(header);
    for (const row of data.purchases) {
      sheet.addRow(purchaseRowValues(row));
    }
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
  }

  if (sheets.includes('rewards')) {
    const sheet = workbook.addWorksheet('Reward Requests');
    const header = sheet.addRow([...REWARD_EXPORT_COLUMNS]);
    styleHeader(header);
    for (const row of data.rewards) {
      sheet.addRow(rewardRowValues(row));
    }
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
