import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  ACTIVITY_ACTIONS,
  buildExportFileName,
  canExportReports,
  exportReportSchema,
  type ExportReportResult,
} from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { assertAppCheck, appCheckCallableOptions } from '../security/appCheck';
import { enforceRateLimit } from '../security/rateLimit';
import { collectReportData } from './collectReportData';
import { buildExcelBuffer } from './buildExcel';
import { buildPdfBuffer } from './buildPdf';

export const exportReport = onCall(
  { cors: true, ...appCheckCallableOptions(), timeoutSeconds: 120, memory: '512MiB' },
  async (request): Promise<ExportReportResult> => {
    assertAppCheck(request, 'exportReport');
    const ctx = requireAuth(request);
    if (!canExportReports(ctx.role)) {
      throw new HttpsError('permission-denied', 'OWNER or MANAGER access required to export.');
    }

    await enforceRateLimit({
      uid: ctx.uid,
      action: 'exportReport',
      maxCalls: 10,
      windowMs: 15 * 60 * 1000,
    });

    let input;
    try {
      input = exportReportSchema.parse(request.data ?? {});
    } catch (err) {
      throw new HttpsError(
        'invalid-argument',
        err instanceof Error ? err.message : 'Invalid export filters.',
      );
    }

    let data;
    try {
      data = await collectReportData(input);
    } catch (err) {
      throw new HttpsError(
        'internal',
        err instanceof Error ? err.message : 'Failed to collect report data.',
      );
    }

    await writeActivityLog({
      actorUid: ctx.uid,
      actorRole: ctx.role,
      action: ACTIVITY_ACTIONS.REPORT_EXPORTED,
      entityType: 'report',
      entityId: input.format,
      metadata: {
        format: input.format,
        sheets: input.sheets,
        from: input.from ?? null,
        to: input.to ?? null,
        rewardStatus: input.rewardStatus ?? null,
        search: input.search ?? null,
        recordedBy: input.recordedBy ?? null,
        customerCount: data.summary.customerCount,
        purchaseCount: data.summary.purchaseCount,
        rewardCount: data.summary.rewardCount,
      },
    });

    if (input.format === 'json') {
      return { ok: true as const, format: 'json', data };
    }

    if (input.format === 'xlsx') {
      const buffer = await buildExcelBuffer(data, input.sheets);
      const fileName = buildExportFileName('xlsx', new Date(data.summary.generatedAt));
      return {
        ok: true as const,
        format: 'xlsx',
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        contentBase64: buffer.toString('base64'),
        summary: data.summary,
      };
    }

    const buffer = await buildPdfBuffer(data);
    const fileName = buildExportFileName('pdf', new Date(data.summary.generatedAt));
    return {
      ok: true as const,
      format: 'pdf',
      fileName,
      mimeType: 'application/pdf',
      contentBase64: buffer.toString('base64'),
      summary: data.summary,
    };
  },
);
