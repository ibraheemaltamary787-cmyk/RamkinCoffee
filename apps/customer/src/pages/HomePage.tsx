import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { LoyaltyProgressDto, MyPurchaseDto } from '@ramkin/shared';
import { CustomerShell } from '../components/CustomerShell';
import { StampCard } from '../components/StampCard';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { openFoodicsMenu } from '../config';
import {
  callGetLoyaltyProgress,
  callListMyPurchases,
  callRequestReward,
} from '../services/callables';

function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en');
  } catch {
    return iso;
  }
}

export function HomePage() {
  const { loading, user, displayName, configured } = useAuth();
  const { t, locale } = useLocale();
  const [progress, setProgress] = useState<LoyaltyProgressDto | null>(null);
  const [purchases, setPurchases] = useState<MyPurchaseDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [progressResult, purchaseResult] = await Promise.all([
        callGetLoyaltyProgress(),
        callListMyPurchases({ limit: 5 }),
      ]);
      setProgress(progressResult.progress);
      setPurchases(purchaseResult.purchases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load loyalty progress.');
    }
  }, []);

  useEffect(() => {
    if (!configured || !user) return;
    void refresh();
  }, [configured, user, refresh]);

  async function onRequestReward() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await callRequestReward();
      setMessage(t('rewardRequested'));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 text-center">
        <p className="text-[var(--ramkin-gold-soft)]">{t('configureFirebase')}</p>
        <Link to="/" className="mt-4 text-[var(--ramkin-gold)] underline">
          {t('home')}
        </Link>
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const identity = displayName || user.email || user.phoneNumber || 'Guest';
  const canRequest = progress?.rewardEligible === true && !progress.openRewardRequestId;

  return (
    <CustomerShell>
      <section className="animate-fade-up">
        <p className="text-sm text-[var(--ramkin-mist)]/55">{t('welcome')}</p>
        <h1
          className="mt-1 truncate text-2xl text-[var(--ramkin-mist)] sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {identity}
        </h1>
      </section>

      <section className="animate-fade-up mt-6" style={{ animationDelay: '60ms' }}>
        <StampCard progress={progress} />
      </section>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {canRequest ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRequestReward()}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2.5 text-xs tracking-[0.18em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)] disabled:opacity-50"
          >
            {busy ? t('requesting') : t('requestReward')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh()}
          className="border border-white/15 px-4 py-2.5 text-xs tracking-[0.18em] text-[var(--ramkin-mist)]/70 uppercase transition hover:border-[var(--ramkin-gold)]/40 hover:text-[var(--ramkin-gold)]"
        >
          {t('refresh')}
        </button>
      </div>

      <section className="animate-fade-up mt-8 grid gap-3" style={{ animationDelay: '120ms' }}>
        <button
          type="button"
          onClick={() => openFoodicsMenu()}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/15 px-5 py-4 text-start transition hover:bg-[var(--ramkin-gold)]/25"
        >
          <p className="text-sm tracking-[0.16em] text-[var(--ramkin-gold)] uppercase">
            {t('orderOnline')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ramkin-mist)]/55">
            {t('orderOnlineHint')}
          </p>
        </button>
        <Link
          to="/order/instore"
          className="border border-[var(--ramkin-line)] bg-black/35 px-5 py-4 transition hover:border-[var(--ramkin-gold)]/50"
        >
          <p className="text-sm tracking-[0.16em] text-[var(--ramkin-gold-soft)] uppercase">
            {t('orderAtRamkin')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ramkin-mist)]/55">
            {t('orderAtRamkinHint')}
          </p>
        </Link>
      </section>

      <section className="animate-fade-up mt-8" style={{ animationDelay: '180ms' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            {t('recentPurchases')}
          </h2>
          <Link to="/history" className="text-xs text-[var(--ramkin-gold)]/80 hover:underline">
            {t('historyTitle')}
          </Link>
        </div>
        {purchases.length === 0 ? (
          <p className="border border-white/10 bg-black/30 px-4 py-5 text-sm text-[var(--ramkin-mist)]/55">
            {t('noPurchasesYet')}
          </p>
        ) : (
          <ul className="space-y-2">
            {purchases.map((p) => (
              <li
                key={p.purchaseId}
                className="flex items-center justify-between gap-3 border border-white/10 bg-black/30 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-[var(--ramkin-mist)]/80">
                    {formatWhen(p.createdAt, locale)}
                  </p>
                  <p className="text-[10px] tracking-[0.14em] text-[var(--ramkin-gold-soft)]/60 uppercase">
                    {p.channel === 'online'
                      ? t('channelOnline')
                      : p.channel === 'in_store'
                        ? t('channelInStore')
                        : t('stamp')}
                    {p.orderRef ? ` · ${p.orderRef}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[var(--ramkin-gold)]">{t('stamp')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {progress?.openRewardStatus ? (
        <section className="animate-fade-up mt-8 border border-[var(--ramkin-line)] bg-black/40 px-4 py-4">
          <h2 className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            {t('rewardStatus')}
          </h2>
          <p className="mt-2 text-sm text-[var(--ramkin-mist)]/80">
            {progress.openRewardStatus === 'requested'
              ? t('awaitingApproval')
              : progress.openRewardStatus === 'approved'
                ? t('approvedRedeem')
                : progress.openRewardStatus}
          </p>
          <Link to="/rewards" className="mt-3 inline-block text-xs text-[var(--ramkin-gold)] hover:underline">
            {t('navRewards')}
          </Link>
        </section>
      ) : null}
    </CustomerShell>
  );
}
