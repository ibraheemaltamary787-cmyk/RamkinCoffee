import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PurchaseListItemDto } from '@ramkin/shared';
import { callListPurchases } from '../services/callables';

export function TransactionsPage() {
  const [customerId, setCustomerId] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [purchases, setPurchases] = useState<PurchaseListItemDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListPurchases({
        customerId: customerId.trim() || undefined,
        recordedBy: recordedBy.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 50,
      });
      setPurchases(result.purchases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load purchases.');
    } finally {
      setBusy(false);
    }
  }, [customerId, recordedBy, from, to]);

  useEffect(() => {
    void refresh();
    // Initial load without filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Transactions
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">
        Purchase history with optional customer, staff, and date filters. For Excel/PDF, use{' '}
        <Link to="/app/reports" className="text-[var(--ramkin-gold)] hover:underline">
          Reports
        </Link>
        .
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void refresh();
        }}
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Customer UID"
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <input
          value={recordedBy}
          onChange={(e) => setRecordedBy(e.target.value)}
          placeholder="Recorded by UID"
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50 sm:col-span-2 lg:col-span-4 lg:w-fit"
        >
          {busy ? 'Loading…' : 'Apply filters'}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mt-6 overflow-x-auto border border-white/10 bg-black/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Channel</th>
              <th>Order / ref</th>
              <th>When</th>
              <th>Staff</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-[var(--ramkin-mist)]/50">
                  No purchases match.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.purchaseId}>
                  <td>
                    <Link
                      to={`/app/customers/${p.customerId}`}
                      className="text-[var(--ramkin-mist)] hover:text-[var(--ramkin-gold)]"
                    >
                      {p.customerName ?? p.customerId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="text-[var(--ramkin-mist)]/55">{p.customerPhone ?? '—'}</td>
                  <td className="text-[var(--ramkin-mist)]/55">{p.channel ?? '—'}</td>
                  <td className="text-[var(--ramkin-mist)]/45">{p.orderRef ?? '—'}</td>
                  <td className="whitespace-nowrap text-[var(--ramkin-mist)]/50">
                    {p.createdAt ?? '—'}
                  </td>
                  <td className="font-mono text-xs text-[var(--ramkin-mist)]/45">
                    {p.recordedBy.slice(0, 8)}…
                  </td>
                  <td className="text-[var(--ramkin-mist)]/40">{p.note ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
