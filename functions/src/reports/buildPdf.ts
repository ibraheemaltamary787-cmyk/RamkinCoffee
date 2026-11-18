import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { BRAND, type ReportDataDto } from '@ramkin/shared';

/** Official logo copy — unmodified binary from app public/brand/ramkin-logo.jpg. */
function resolveLogoPath(): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'assets', 'brand', 'ramkin-logo.jpg'),
    path.join(process.cwd(), 'assets', 'brand', 'ramkin-logo.jpg'),
    path.join(process.cwd(), 'functions', 'assets', 'brand', 'ramkin-logo.jpg'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export async function buildPdfBuffer(data: ReportDataDto): Promise<Buffer> {
  const logoPath = resolveLogoPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: `${BRAND.product} Loyalty Summary`,
        Author: BRAND.name,
        Subject: 'Loyalty export summary',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Brand header — official logo when present; never invent artwork.
    if (logoPath) {
      try {
        doc.image(logoPath, 48, 40, { width: 56, height: 56 });
      } catch {
        // Fall through to text-only branding if image decode fails.
      }
    }

    doc
      .fillColor('#C9A962')
      .fontSize(22)
      .text(BRAND.name, logoPath ? 116 : 48, 48, { continued: false });
    doc.fillColor('#333333').fontSize(11).text('Loyalty summary report', logoPath ? 116 : 48);
    doc.moveDown(1.5);

    const { summary } = data;
    doc.fillColor('#0A0A0A').fontSize(12).text('Filters', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Generated: ${summary.generatedAt}`);
    doc.text(`Date range: ${summary.from ?? 'any'} → ${summary.to ?? 'any'}`);
    doc.text(`Search: ${summary.search ?? '—'}`);
    doc.text(`Staff (recorded by): ${summary.recordedBy ?? '—'}`);
    doc.text(`Reward status: ${summary.rewardStatus ?? 'all'}`);
    doc.moveDown(1);

    doc.fillColor('#0A0A0A').fontSize(12).text('Totals', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Customers: ${summary.customerCount}`);
    doc.text(`Purchases: ${summary.purchaseCount}`);
    doc.text(`Reward requests: ${summary.rewardCount}`);
    const statusLines = Object.entries(summary.rewardStatusCounts)
      .map(([status, count]) => `  ${status}: ${count}`)
      .join('\n');
    if (statusLines) {
      doc.text('By reward status:');
      doc.text(statusLines);
    }
    doc.moveDown(1);

    doc.fillColor('#0A0A0A').fontSize(12).text('Recent purchases (sample)', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor('#333333');
    const purchaseSample = data.purchases.slice(0, 15);
    if (purchaseSample.length === 0) {
      doc.text('No purchases in this filter window.');
    } else {
      for (const p of purchaseSample) {
        doc.text(
          `${p.createdAt ?? '—'} · ${p.customerName ?? p.customerId.slice(0, 8)} · staff ${p.recordedBy.slice(0, 8)}`,
        );
      }
      if (data.purchases.length > purchaseSample.length) {
        doc.text(`…and ${data.purchases.length - purchaseSample.length} more in Excel export.`);
      }
    }
    doc.moveDown(1);

    doc.fillColor('#0A0A0A').fontSize(12).text('Reward requests (sample)', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor('#333333');
    const rewardSample = data.rewards.slice(0, 15);
    if (rewardSample.length === 0) {
      doc.text('No reward requests in this filter window.');
    } else {
      for (const r of rewardSample) {
        doc.text(
          `${r.status.toUpperCase()} · ${r.requestedAt ?? '—'} · ${r.customerName ?? r.customerId.slice(0, 8)}`,
        );
      }
      if (data.rewards.length > rewardSample.length) {
        doc.text(`…and ${data.rewards.length - rewardSample.length} more in Excel export.`);
      }
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#888888')
      .text(`${BRAND.product} · Confidential · For OWNER / MANAGER use only`, {
        align: 'center',
      });

    doc.end();
  });
}
