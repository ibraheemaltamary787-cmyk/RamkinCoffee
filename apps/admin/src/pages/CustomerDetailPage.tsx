import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { canRotateCustomerQr, type CustomerDetailDto } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callGetCustomerDetail, callRotateCustomerQr } from '../services/callables';

export function CustomerDetailPage() {
  const { customerId = '' } = useParams();
  const { role } = useAuth();
  const { t } = useLocale();
  const [detail, setDetail] = useState<CustomerDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await callGetCustomerDetail({ customerId });
      setDetail(result.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('customerDetailLoadError'));
    } finally {
      setLoading(false);
    }
  }, [customerId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRotateQr = useCallback(async () => {
    if (!customerId || !canRotateCustomerQr(role)) return;
    const confirmed = window.confirm(
      t('customerDetailRotateConfirm'),
    );
    if (!confirmed) return;
    setRotating(true);
    setError(null);
    try {
      await callRotateCustomerQr({ customerId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('customerDetailRotateFailed'));
    } finally {
      setRotating(false);
    }
  }, [customerId, refresh, role, t]);

  if (loading && !detail) {
    return <p className="text-sm text-[var(--ramkin-mist)]/45">{t('customerDetailLoading')}</p>;
  }

  if (error && !detail) {
    return (
      <section>
        <p className="text-sm text-red-300/90">{error}</p>
        <Link to="/app/customers" className="mt-4 inline-block text-[var(--ramkin-gold)]">
          {t('customerDetailBack')}
        </Link>
      </section>
    );
  }

  if (!detail) return null;
  const { customer, purchases, rewards, combos } = detail;
  const mayRotate = canRotateCustomerQr(role);

  return (
    <section className="animate-fade-up customer-print-root space-y-8">
      <div>
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/app/customers"
            className="text-xs tracking-[0.18em] text-[var(--ramkin-mist)]/45 uppercase hover:text-[var(--ramkin-gold)]"
          >
            ← Customers
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="border border-white/20 px-3 py-1.5 text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/70 uppercase hover:border-[var(--ramkin-gold)]/50"
          >
            {t('print')}
          </button>
        </div>
        <header className="mt-3 flex items-center gap-4">
          <img
            src="/brand/ramkin-logo.jpg"
            alt="RAMKIN"
            className="hidden h-12 w-12 rounded-full object-cover print:block"
          />
          <div>
            <h1
              className="text-3xl tracking-[0.08em] text-[var(--ramkin-gold)] print:text-black"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {customer.displayName || 'Customer'}
            </h1>
            <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60 print:text-black/70">
              {customer.phone ?? '—'} · {customer.status} · lifetime {customer.totalPurchases}{' '}
              purchases · {customer.totalRewardsRedeemed} redeemed
            </p>
          </div>
        </header>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            Current combo
          </p>
          <p
            className="mt-2 text-2xl text-[var(--ramkin-gold)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {customer.purchaseCount}/{customer.requiredPurchases}
          </p>
          <p className="mt-1 text-xs text-[var(--ramkin-gold-soft)]/70 uppercase tracking-[0.12em]">
            {customer.comboStatus ?? 'none'}
          </p>
        </div>
        <div className="border border-white/10 bg-black/30 p-4 sm:col-span-2">
          <p className="text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            {t('customerDetailQrToken')}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-[var(--ramkin-mist)]/70">
            {customer.qrToken || '—'}
          </p>
          <div className="print:hidden mt-3 flex flex-wrap items-center gap-4">
            <Link
              to={`/app/counter?qr=${encodeURIComponent(customer.qrToken)}`}
              className="text-xs tracking-[0.15em] text-[var(--ramkin-gold)] uppercase"
            >
              {t('customerDetailOpenCounter')}
            </Link>
            {mayRotate ? (
              <button
                type="button"
                disabled={rotating}
                onClick={() => void onRotateQr()}
                className="border border-white/20 px-3 py-1.5 text-[10px] tracking-[0.2em] text-[var(--ramkin-mist)]/70 uppercase hover:border-[var(--ramkin-gold)]/50 disabled:opacity-40"
              >
                {rotating ? t('customerDetailRotating') : t('customerDetailRotate')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
          {t('customerDetailPurchases')}
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border border-white/10">
          {purchases.length === 0 ? (
            <li className="p-3 text-sm text-[var(--ramkin-mist)]/45">No purchases yet.</li>
          ) : (
            purchases.map((p) => (
              <li
                key={p.purchaseId}
                className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-[var(--ramkin-mist)]/80">{p.createdAt ?? '—'}</span>
                <span className="text-[var(--ramkin-mist)]/45">
                  by {p.recordedBy.slice(0, 8)}…
                </span>
                {p.note ? (
                  <span className="w-full text-xs text-[var(--ramkin-mist)]/40">{p.note}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
          {t('customerDetailRewards')}
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border border-white/10">
          {rewards.length === 0 ? (
            <li className="p-3 text-sm text-[var(--ramkin-mist)]/45">No reward requests.</li>
          ) : (
            rewards.map((r) => (
              <li key={r.requestId} className="px-3 py-2 text-sm">
                <p className="text-[var(--ramkin-mist)]/80">
                  <span className="text-[var(--ramkin-gold)] uppercase tracking-[0.12em]">
                    {r.status}
                  </span>
                  {' · '}
                  {r.requestedAt ?? '—'}
                </p>
                {r.rejectedReason ? (
                  <p className="text-xs text-red-200/70">Reason: {r.rejectedReason}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
          {t('customerDetailCombos')}
        </h2>
        <ul className="mt-3 divide-y divide-white/10 border border-white/10">
          {combos.map((c) => (
            <li key={c.comboId} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
              <span className="text-[var(--ramkin-mist)]/80">
                {c.purchaseCount}/{c.requiredPurchases} · {c.status}
              </span>
              <span className="text-xs text-[var(--ramkin-mist)]/40">{c.startedAt ?? '—'}</span>
            </li>
          ))}
        </ul>
      </div>

      {error ? <p className="text-sm text-red-300/90">{error}</p> : null}
    </section>
  );
}
