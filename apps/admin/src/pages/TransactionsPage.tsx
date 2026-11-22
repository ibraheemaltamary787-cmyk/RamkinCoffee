import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PurchaseChannel, PurchaseListItemDto, VerificationStatus } from '@ramkin/shared';
import { useLocale } from '../i18n/LocaleContext';
import { callListPurchases } from '../services/callables';

function channelLabel(
  channel: PurchaseChannel | null | undefined,
  t: (key: 'channelOnline' | 'channelInStore' | 'none') => string,
): string {
  if (channel === 'online') return t('channelOnline');
  if (channel === 'in_store') return t('channelInStore');
  return t('none');
}

function verificationLabel(
  status: VerificationStatus | null | undefined,
  t: (
    key: 'verificationVerified' | 'verificationPending' | 'verificationRejected' | 'none',
  ) => string,
): string {
  if (status === 'verified') return t('verificationVerified');
  if (status === 'pending') return t('verificationPending');
  if (status === 'rejected') return t('verificationRejected');
  return t('none');
}

export function TransactionsPage() {
  const { t, locale } = useLocale();
  const [customerId, setCustomerId] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [channel, setChannel] = useState<PurchaseChannel | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');
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
        channel: channel || undefined,
        verificationStatus: verificationStatus || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 50,
      });
      setPurchases(result.purchases);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transactionsLoadError'));
    } finally {
      setBusy(false);
    }
  }, [customerId, recordedBy, from, to, channel, verificationStatus, t]);

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
        {t('transactionsTitle')}
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">
        {t('transactionsSub')}{' '}
        <Link to="/app/reports" className="text-[var(--ramkin-gold)] hover:underline">
          {t('transactionsSubLink')}
        </Link>
        .
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void refresh();
        }}
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder={t('transactionsCustomerUid')}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <input
          value={recordedBy}
          onChange={(e) => setRecordedBy(e.target.value)}
          placeholder={t('transactionsRecordedBy')}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
        />
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as PurchaseChannel | '')}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          aria-label={t('transactionsFilterChannel')}
        >
          <option value="">{t('filterAll')} — {t('channel')}</option>
          <option value="online">{t('channelOnline')}</option>
          <option value="in_store">{t('channelInStore')}</option>
        </select>
        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus | '')}
          className="border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50"
          aria-label={t('transactionsFilterVerification')}
        >
          <option value="">
            {t('filterAll')} — {t('verification')}
          </option>
          <option value="verified">{t('verificationVerified')}</option>
          <option value="pending">{t('verificationPending')}</option>
          <option value="rejected">{t('verificationRejected')}</option>
        </select>
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
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50 sm:col-span-2 lg:col-span-3 lg:w-fit"
        >
          {busy ? t('loading') : t('applyFilters')}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mt-6 overflow-x-auto border border-white/10 bg-black/30">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('customer')}</th>
              <th>{t('phone')}</th>
              <th>{t('channel')}</th>
              <th>{t('orderRef')}</th>
              <th>{t('verification')}</th>
              <th>{t('when')}</th>
              <th>{t('staff')}</th>
              <th>{t('note')}</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-[var(--ramkin-mist)]/50">
                  {t('transactionsEmpty')}
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
                  <td className="text-[var(--ramkin-mist)]/55">{p.customerPhone ?? t('none')}</td>
                  <td>
                    <span className="admin-chip admin-chip--gold">
                      {channelLabel(p.channel, t)}
                    </span>
                  </td>
                  <td className="text-[var(--ramkin-mist)]/45">{p.orderRef ?? t('none')}</td>
                  <td>
                    <span className="admin-chip">
                      {verificationLabel(p.verificationStatus, t)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[var(--ramkin-mist)]/50">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString(locale === 'ar' ? 'ar' : 'en')
                      : t('none')}
                  </td>
                  <td className="font-mono text-xs text-[var(--ramkin-mist)]/45">
                    {p.recordedBy.slice(0, 8)}…
                  </td>
                  <td className="text-[var(--ramkin-mist)]/40">{p.note ?? t('none')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
