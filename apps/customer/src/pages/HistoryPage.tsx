import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { MyPurchaseDto } from '@ramkin/shared';
import { CustomerShell } from '../components/CustomerShell';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callListMyPurchases } from '../services/callables';

function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en');
  } catch {
    return iso;
  }
}

export function HistoryPage() {
  const { loading, user, configured } = useAuth();
  const { t, locale } = useLocale();
  const [purchases, setPurchases] = useState<MyPurchaseDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListMyPurchases({ limit: 40 });
      setPurchases(result.purchases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load purchase history.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!configured || !user) return;
    void refresh();
  }, [configured, user, refresh]);

  if (!configured) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 text-[var(--ramkin-gold-soft)]">
        {t('configureFirebase')}
      </main>
    );
  }
  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-[var(--ramkin-gold-soft)]">
        {t('loading')}
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <CustomerShell title={t('historyTitle')} subtitle={t('historySub')}>
      {error ? <p className="mb-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="text-xs tracking-[0.18em] text-[var(--ramkin-gold-soft)]/80 uppercase hover:text-[var(--ramkin-gold)] disabled:opacity-50"
        >
          {busy ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {purchases.length === 0 && !busy ? (
        <p className="border border-white/10 bg-black/30 px-4 py-6 text-sm text-[var(--ramkin-mist)]/55">
          {t('noPurchasesYet')}
        </p>
      ) : (
        <ul className="space-y-3">
          {purchases.map((p) => (
            <li
              key={p.purchaseId}
              className="animate-fade-up border border-[var(--ramkin-line)] bg-black/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--ramkin-mist)]/85">
                    {formatWhen(p.createdAt, locale)}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.14em] text-[var(--ramkin-gold-soft)]/60 uppercase">
                    {p.channel === 'online'
                      ? t('channelOnline')
                      : p.channel === 'in_store'
                        ? t('channelInStore')
                        : t('stamp')}
                    {p.orderRef ? ` · ${p.orderRef}` : ''}
                  </p>
                  {p.note ? (
                    <p className="mt-1 text-xs text-[var(--ramkin-mist)]/45">{p.note}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm text-[var(--ramkin-gold)]">
                  {p.amount != null ? p.amount.toFixed(2) : t('stamp')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CustomerShell>
  );
}
