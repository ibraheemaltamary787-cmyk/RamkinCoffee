import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { canViewReports, type AdminStatsDto } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callGetAdminStats } from '../services/callables';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-white/10 bg-black/35 p-4 transition hover:border-[var(--ramkin-gold)]/35">
      <dt className="text-[10px] tracking-[0.22em] text-[var(--ramkin-mist)]/45 uppercase">
        {label}
      </dt>
      <dd
        className="mt-2 text-2xl text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-[var(--ramkin-mist)]/40">{hint}</p> : null}
    </div>
  );
}

export function OverviewPage() {
  const { role } = useAuth();
  const { t } = useLocale();
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await callGetAdminStats();
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('overviewLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('overviewTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ramkin-mist)]/65">
            {t('overviewSub', { role: role ?? '—' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void refresh();
          }}
          className="border border-white/15 px-3 py-2 text-xs tracking-[0.18em] uppercase hover:border-[var(--ramkin-gold)]/40"
        >
          {t('refresh')}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {loading && !stats ? (
        <p className="mt-8 text-sm text-[var(--ramkin-mist)]/45">{t('overviewLoading')}</p>
      ) : null}

      {stats ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t('statCustomers')} value={stats.totalCustomers} />
          <Stat
            label={t('statPurchases')}
            value={stats.totalPurchases}
            hint={t('statPurchasesToday', { n: stats.purchasesToday })}
          />
          <Stat label={t('statActiveCombos')} value={stats.combosActive} />
          <Stat
            label={t('statCompletedCombos')}
            value={stats.combosCompleted}
            hint={t('statCompletedHint')}
          />
          <Stat label={t('statRewardRequested')} value={stats.rewardRequested} />
          <Stat label={t('statRewardApproved')} value={stats.rewardApproved} />
          <Stat label={t('statRewardRejected')} value={stats.rewardRejected} />
          <Stat label={t('statRewardRedeemed')} value={stats.rewardRedeemed} />
        </dl>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/app/counter"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            {t('quickCounter')}
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">{t('quickCounterHint')}</p>
        </Link>
        <Link
          to="/app/rewards"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            {t('quickRewards')}
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">{t('quickRewardsHint')}</p>
        </Link>
        <Link
          to="/app/customers"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            {t('quickCustomers')}
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">{t('quickCustomersHint')}</p>
        </Link>
        {canViewReports(role) ? (
          <Link
            to="/app/reports"
            className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
          >
            <p className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
              {t('quickReports')}
            </p>
            <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">{t('quickReportsHint')}</p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
