import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { canViewReports, type AdminStatsDto } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { callGetAdminStats } from '../services/callables';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-white/10 bg-black/35 p-4 transition hover:border-[var(--ramkin-gold)]/35">
      <dt className="text-[10px] tracking-[0.22em] text-[var(--ramkin-cream)]/45 uppercase">
        {label}
      </dt>
      <dd
        className="mt-2 text-2xl text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-[var(--ramkin-cream)]/40">{hint}</p> : null}
    </div>
  );
}

export function OverviewPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await callGetAdminStats();
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load stats.');
    } finally {
      setLoading(false);
    }
  }, []);

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
            Operations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ramkin-cream)]/65">
            Live shop overview for {role}. Counts come from Cloud Functions — no Firebase console
            required for day-to-day ops.
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
          Refresh
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {loading && !stats ? (
        <p className="mt-8 text-sm text-[var(--ramkin-cream)]/45">Loading stats…</p>
      ) : null}

      {stats ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Customers" value={stats.totalCustomers} />
          <Stat
            label="Purchases"
            value={stats.totalPurchases}
            hint={`${stats.purchasesToday} today`}
          />
          <Stat label="Active combos" value={stats.combosActive} />
          <Stat label="Completed combos" value={stats.combosCompleted} hint="Awaiting request" />
          <Stat label="Reward requested" value={stats.rewardRequested} />
          <Stat label="Reward approved" value={stats.rewardApproved} />
          <Stat label="Reward rejected" value={stats.rewardRejected} />
          <Stat label="Reward redeemed" value={stats.rewardRedeemed} />
        </dl>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/app/counter"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">
            Counter
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Lookup · stamp · redeem →</p>
        </Link>
        <Link
          to="/app/rewards"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">
            Rewards
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Approve · reject · redeem →</p>
        </Link>
        <Link
          to="/app/customers"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <p className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">
            Customers
          </p>
          <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Search · history →</p>
        </Link>
        {canViewReports(role) ? (
          <Link
            to="/app/reports"
            className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
          >
            <p className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">
              Reports
            </p>
            <p className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Excel · PDF · print →</p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
