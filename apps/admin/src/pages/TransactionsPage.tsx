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
      <p className="mt-2 text-sm text-[var(--ramkin-cream)]/60">
        Purchase history with optional customer, staff, and date filters. Excel/PDF export is Phase
        6.
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

      <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-black/25">
        {purchases.length === 0 ? (
          <li className="p-4 text-sm text-[var(--ramkin-cream)]/50">No purchases match.</li>
        ) : (
          purchases.map((p) => (
            <li
              key={p.purchaseId}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div>
                <Link
                  to={`/app/customers/${p.customerId}`}
                  className="text-[var(--ramkin-cream)] hover:text-[var(--ramkin-gold)]"
                >
                  {p.customerName ?? p.customerId.slice(0, 8)}
                </Link>
                <p className="text-xs text-[var(--ramkin-cream)]/45">{p.customerPhone ?? '—'}</p>
                {p.note ? (
                  <p className="mt-1 text-xs text-[var(--ramkin-cream)]/40">{p.note}</p>
                ) : null}
              </div>
              <div className="text-right text-xs text-[var(--ramkin-cream)]/50">
                <p>{p.createdAt ?? '—'}</p>
                <p className="mt-1">staff {p.recordedBy.slice(0, 8)}…</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
