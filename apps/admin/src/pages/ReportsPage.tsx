import { useCallback, useState } from 'react';
import {
  REWARD_REQUEST_STATUSES,
  canExportReports,
  type ReportDataDto,
  type ReportFormat,
  type ReportSheet,
  type ReportSummaryDto,
} from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { callExportReport } from '../services/callables';

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string): void {
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

const SHEET_OPTIONS: { id: ReportSheet; label: string }[] = [
  { id: 'customers', label: 'Customers' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'rewards', label: 'Reward requests' },
];

export function ReportsPage() {
  const { role } = useAuth();
  const allowed = canExportReports(role);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [rewardStatus, setRewardStatus] = useState('');
  const [sheets, setSheets] = useState<ReportSheet[]>(['customers', 'purchases', 'rewards']);
  const [preview, setPreview] = useState<ReportDataDto | null>(null);
  const [lastSummary, setLastSummary] = useState<ReportSummaryDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSheet = (id: ReportSheet) => {
    setSheets((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((s) => s !== id);
        return next.length === 0 ? prev : next;
      }
      return [...prev, id];
    });
  };

  const runExport = useCallback(
    async (format: ReportFormat) => {
      if (!allowed) return;
      setBusy(true);
      setError(null);
      try {
        const result = await callExportReport({
          format,
          sheets,
          from: from || undefined,
          to: to || undefined,
          search: search.trim() || undefined,
          recordedBy: recordedBy.trim() || undefined,
          rewardStatus:
            rewardStatus &&
            (REWARD_REQUEST_STATUSES as readonly string[]).includes(rewardStatus)
              ? (rewardStatus as (typeof REWARD_REQUEST_STATUSES)[number])
              : undefined,
          limit: 500,
        });

        if (result.format === 'json') {
          setPreview(result.data);
          setLastSummary(result.data.summary);
          return;
        }

        setLastSummary(result.summary);
        downloadBase64File(result.fileName, result.mimeType, result.contentBase64);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed.');
      } finally {
        setBusy(false);
      }
    },
    [allowed, sheets, from, to, search, recordedBy, rewardStatus],
  );

  if (!allowed) {
    return (
      <section className="animate-fade-up">
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Reports
        </h1>
        <p className="mt-3 text-sm text-[var(--ramkin-mist)]/60">
          Excel and PDF exports are limited to OWNER and MANAGER.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-fade-up report-print-root">
      <div className="print:hidden">
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ramkin-mist)]/60">
          Filter loyalty data, download Excel (customers / purchases / reward requests), or a branded
          PDF summary. Print uses the on-screen preview.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runExport('json');
          }}
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone"
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <input
            value={recordedBy}
            onChange={(e) => setRecordedBy(e.target.value)}
            placeholder="Recorded by UID"
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          />
          <select
            value={rewardStatus}
            onChange={(e) => setRewardStatus(e.target.value)}
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          >
            <option value="">All reward statuses</option>
            {REWARD_REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
            {SHEET_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-xs tracking-[0.12em] text-[var(--ramkin-mist)]/70 uppercase"
              >
                <input
                  type="checkbox"
                  checked={sheets.includes(opt.id)}
                  onChange={() => toggleSheet(opt.id)}
                  className="accent-[var(--ramkin-gold)]"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Preview'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runExport('xlsx')}
              className="border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/80 uppercase hover:border-[var(--ramkin-gold)]/50 disabled:opacity-50"
            >
              Download Excel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runExport('pdf')}
              className="border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/80 uppercase hover:border-[var(--ramkin-gold)]/50 disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              disabled={!preview}
              onClick={() => window.print()}
              className="border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/80 uppercase hover:border-[var(--ramkin-gold)]/50 disabled:opacity-50"
            >
              Print preview
            </button>
          </div>
        </form>

        {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
        {lastSummary && !preview ? (
          <p className="mt-4 text-xs text-[var(--ramkin-mist)]/45">
            Last export · customers {lastSummary.customerCount} · purchases{' '}
            {lastSummary.purchaseCount} · rewards {lastSummary.rewardCount}
          </p>
        ) : null}
      </div>

      {preview ? (
        <div className="mt-10 space-y-8 print:mt-0">
          <header className="flex items-center gap-4 border-b border-white/10 pb-4 print:border-black/20">
            <img
              src="/brand/ramkin-logo.jpg"
              alt="RAMKIN"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/40 print:ring-black/30"
            />
            <div>
              <p
                className="text-2xl tracking-[0.15em] text-[var(--ramkin-gold)] print:text-black"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                RAMKIN
              </p>
              <p className="text-xs tracking-[0.18em] text-[var(--ramkin-mist)]/50 uppercase print:text-black/60">
                Loyalty report · {preview.summary.generatedAt}
              </p>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-white/10 p-3 print:border-black/20">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--ramkin-mist)]/45 print:text-black/50">
                Customers
              </p>
              <p className="mt-1 text-xl text-[var(--ramkin-gold)] print:text-black">
                {preview.summary.customerCount}
              </p>
            </div>
            <div className="border border-white/10 p-3 print:border-black/20">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--ramkin-mist)]/45 print:text-black/50">
                Purchases
              </p>
              <p className="mt-1 text-xl text-[var(--ramkin-gold)] print:text-black">
                {preview.summary.purchaseCount}
              </p>
            </div>
            <div className="border border-white/10 p-3 print:border-black/20">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--ramkin-mist)]/45 print:text-black/50">
                Rewards
              </p>
              <p className="mt-1 text-xl text-[var(--ramkin-gold)] print:text-black">
                {preview.summary.rewardCount}
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--ramkin-mist)]/45 print:text-black/60">
            Range {preview.summary.from ?? 'any'} → {preview.summary.to ?? 'any'}
            {preview.summary.search ? ` · search “${preview.summary.search}”` : ''}
            {preview.summary.rewardStatus ? ` · status ${preview.summary.rewardStatus}` : ''}
          </p>

          {preview.customers.length > 0 ? (
            <div>
              <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase print:text-black">
                Customers
              </h2>
              <table className="mt-3 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/15 print:border-black/20">
                    <th className="py-2 pr-2 font-normal text-[var(--ramkin-mist)]/50 print:text-black/60">
                      Name
                    </th>
                    <th className="py-2 pr-2 font-normal text-[var(--ramkin-mist)]/50 print:text-black/60">
                      Phone
                    </th>
                    <th className="py-2 font-normal text-[var(--ramkin-mist)]/50 print:text-black/60">
                      Stamps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.customers.slice(0, 40).map((c) => (
                    <tr key={c.customerId} className="border-b border-white/10 print:border-black/10">
                      <td className="py-2 pr-2 text-[var(--ramkin-mist)]/85 print:text-black">
                        {c.displayName || c.customerId.slice(0, 8)}
                      </td>
                      <td className="py-2 pr-2 text-[var(--ramkin-mist)]/55 print:text-black/70">
                        {c.phone ?? '—'}
                      </td>
                      <td className="py-2 text-[var(--ramkin-mist)]/55 print:text-black/70">
                        {c.purchaseCount}/{c.requiredPurchases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {preview.purchases.length > 0 ? (
            <div>
              <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase print:text-black">
                Purchases
              </h2>
              <ul className="mt-3 divide-y divide-white/10 border border-white/10 print:divide-black/10 print:border-black/20">
                {preview.purchases.slice(0, 40).map((p) => (
                  <li
                    key={p.purchaseId}
                    className="flex flex-wrap justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <span className="text-[var(--ramkin-mist)]/80 print:text-black">
                      {p.customerName ?? p.customerId.slice(0, 8)}
                    </span>
                    <span className="text-[var(--ramkin-mist)]/45 print:text-black/60">
                      {p.createdAt ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.rewards.length > 0 ? (
            <div>
              <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase print:text-black">
                Reward requests
              </h2>
              <ul className="mt-3 divide-y divide-white/10 border border-white/10 print:divide-black/10 print:border-black/20">
                {preview.rewards.slice(0, 40).map((r) => (
                  <li key={r.requestId} className="px-3 py-2 text-xs">
                    <span className="tracking-[0.12em] text-[var(--ramkin-gold)] uppercase print:text-black">
                      {r.status}
                    </span>
                    <span className="text-[var(--ramkin-mist)]/70 print:text-black/80">
                      {' '}
                      · {r.customerName ?? r.customerId.slice(0, 8)} · {r.requestedAt ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
