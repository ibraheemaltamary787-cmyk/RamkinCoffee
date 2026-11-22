import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CustomerListItemDto } from '@ramkin/shared';
import { useLocale } from '../i18n/LocaleContext';
import { callListCustomers } from '../services/callables';

export function CustomersPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [customers, setCustomers] = useState<CustomerListItemDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (q: string) => {
      setBusy(true);
      setError(null);
      try {
        const result = await callListCustomers({ query: q || undefined, limit: 50 });
        setCustomers(result.customers);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('customersLoadError'));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void refresh('');
  }, [refresh]);

  return (
    <section className="animate-fade-up">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('customersTitle')}
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">{t('customersSub')}</p>

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
          placeholder={t('customersPlaceholder')}
          className="min-w-[16rem] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
        >
          {busy ? t('searching') : t('search')}
        </button>
      </form>

      {submitted ? (
        <p className="mt-3 text-xs text-[var(--ramkin-mist)]/40">
          {t('customersResultsFor', { q: submitted })}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mt-6 overflow-x-auto border border-white/10 bg-black/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('customer')}</th>
              <th>{t('contact')}</th>
              <th>{t('status')}</th>
              <th>{t('stamps')}</th>
              <th>{t('combo')}</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-[var(--ramkin-mist)]/50">
                  {t('customersEmpty')}
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
                      {c.displayName || c.customerId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="text-[var(--ramkin-mist)]/55">
                    {c.phone ?? c.email ?? t('none')}
                  </td>
                  <td>
                    <span className="admin-chip">{c.status}</span>
                  </td>
                  <td className="text-[var(--ramkin-gold-soft)]">
                    {c.purchaseCount}/{c.requiredPurchases}
                  </td>
                  <td className="text-[var(--ramkin-mist)]/50">{c.comboStatus ?? t('none')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
