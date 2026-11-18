import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CustomerListItemDto } from '@ramkin/shared';
import { callListCustomers } from '../services/callables';

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [customers, setCustomers] = useState<CustomerListItemDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (q: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListCustomers({ query: q || undefined, limit: 50 });
      setCustomers(result.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh('');
  }, [refresh]);

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Customers
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-cream)]/60">
        Search by name or phone. Open a profile for combo status and purchase history.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
          void refresh(query.trim());
        }}
        className="mt-8 flex flex-wrap gap-3"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or phone"
          className="min-w-[16rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
        >
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {submitted ? (
        <p className="mt-3 text-xs text-[var(--ramkin-cream)]/40">Results for “{submitted}”</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <ul className="mt-6 divide-y divide-white/10 border border-white/10 bg-black/25">
        {customers.length === 0 ? (
          <li className="p-4 text-sm text-[var(--ramkin-cream)]/50">No customers found.</li>
        ) : (
          customers.map((c) => (
            <li key={c.customerId}>
              <Link
                to={`/app/customers/${c.customerId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--ramkin-gold)]/5"
              >
                <div>
                  <p className="text-[var(--ramkin-cream)]">{c.displayName || 'Customer'}</p>
                  <p className="text-xs text-[var(--ramkin-cream)]/45">
                    {c.phone ?? '—'} · {c.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--ramkin-gold)]">
                    {c.purchaseCount}/{c.requiredPurchases}
                  </p>
                  <p className="text-[10px] tracking-[0.15em] text-[var(--ramkin-gold-soft)]/60 uppercase">
                    {c.comboStatus ?? 'no combo'}
                  </p>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
