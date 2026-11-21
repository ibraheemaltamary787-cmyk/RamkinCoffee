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
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">
        Search by name, email, or phone. Open a profile for combo status and purchase history.
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
          placeholder="Name, email, or phone"
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
        <p className="mt-3 text-xs text-[var(--ramkin-mist)]/40">Results for “{submitted}”</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mt-6 overflow-x-auto border border-white/10 bg-black/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Stamps</th>
              <th>Combo</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-[var(--ramkin-mist)]/50">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.customerId}>
                  <td>
                    <Link
                      to={`/app/customers/${c.customerId}`}
                      className="text-[var(--ramkin-mist)] hover:text-[var(--ramkin-gold)]"
                    >
                      {c.displayName || 'Customer'}
                    </Link>
                  </td>
                  <td className="text-[var(--ramkin-mist)]/55">
                    <div>{c.email ?? '—'}</div>
                    <div className="text-xs">{c.phone ?? '—'}</div>
                  </td>
                  <td className="text-xs tracking-[0.12em] uppercase text-[var(--ramkin-mist)]/50">
                    {c.status}
                  </td>
                  <td className="text-[var(--ramkin-gold)]">
                    {c.purchaseCount}/{c.requiredPurchases}
                  </td>
                  <td className="text-[10px] tracking-[0.14em] text-[var(--ramkin-gold-soft)]/65 uppercase">
                    {c.comboStatus ?? 'no combo'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
