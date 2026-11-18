import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  BRAND,
  DEFAULT_PURCHASES_REQUIRED,
  progressPercent,
  type LoyaltyProgressDto,
} from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { CustomerQr } from '../components/CustomerQr';
import { useAuth } from '../auth/AuthContext';
import { callGetLoyaltyProgress, callRequestReward } from '../services/callables';

function statusLabel(progress: LoyaltyProgressDto): string {
  switch (progress.comboStatus) {
    case 'completed':
      return 'Reward ready — request your free drink';
    case 'reward_pending':
      return 'Reward requested — awaiting staff approval';
    case 'reward_approved':
      return 'Approved — show this at the counter to redeem';
    case 'active':
    default:
      return progress.remaining === 1
        ? '1 stamp remaining'
        : `${progress.remaining} stamps remaining`;
  }
}

export function DashboardPage() {
  const { loading, user, displayName, signOut, configured } = useAuth();
  const [progress, setProgress] = useState<LoyaltyProgressDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await callGetLoyaltyProgress();
      setProgress(result.progress);
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
      setMessage('Reward requested. Stamps stay until staff redeem your free drink.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 text-center">
        <p className="text-[var(--ramkin-gold-soft)]">
          Configure Firebase env vars before using the dashboard.
        </p>
        <Link to="/" className="mt-4 text-[var(--ramkin-gold)] underline">
          Home
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-[var(--ramkin-gold-soft)]">
        Loading…
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const purchaseCount = progress?.purchaseCount ?? 0;
  const required = progress?.requiredPurchases ?? DEFAULT_PURCHASES_REQUIRED;
  const pct = progressPercent(purchaseCount, required);
  const canRequest = progress?.rewardEligible === true && !progress.openRewardRequestId;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-10">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p
              className="text-xl tracking-[0.15em] text-[var(--ramkin-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {BRAND.name}
            </p>
            <p className="text-xs text-[var(--ramkin-cream)]/55">Loyalty dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)]/80 uppercase hover:text-[var(--ramkin-gold)]"
        >
          Sign out
        </button>
      </header>

      <section className="animate-fade-up border border-[var(--ramkin-gold)]/25 bg-black/40 p-6 shadow-[0_0_50px_rgba(201,169,98,0.08)]">
        <p className="text-sm text-[var(--ramkin-cream)]/60">Welcome</p>
        <h1
          className="mt-1 text-2xl text-[var(--ramkin-cream)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {displayName || user.phoneNumber || 'Guest'}
        </h1>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <p
              className="text-4xl text-[var(--ramkin-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {purchaseCount}
              <span className="text-lg text-[var(--ramkin-gold-soft)]/70"> / {required}</span>
            </p>
            <p className="max-w-[14rem] text-right text-xs leading-relaxed text-[var(--ramkin-cream)]/55">
              {progress ? statusLabel(progress) : 'Loading stamp card…'}
            </p>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden bg-white/5">
            <div
              className="animate-gold-sheen h-full bg-[var(--ramkin-gold)] transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs tracking-[0.15em] text-[var(--ramkin-gold-soft)]/70 uppercase">
            {progress?.remaining ?? required} remaining · buy {required} get next free
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {canRequest ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRequestReward()}
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/15 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase transition hover:bg-[var(--ramkin-gold)]/25 disabled:opacity-50"
            >
              {busy ? 'Requesting…' : 'Request reward'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refresh()}
            className="border border-white/15 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/70 uppercase hover:border-[var(--ramkin-gold)]/40 hover:text-[var(--ramkin-gold)]"
          >
            Refresh
          </button>
        </div>
      </section>

      {progress?.qrToken ? (
        <section
          className="animate-fade-up mt-8 border border-white/10 bg-black/30 p-6 text-center"
          style={{ animationDelay: '120ms' }}
        >
          <h2 className="text-xs tracking-[0.22em] text-[var(--ramkin-gold-soft)] uppercase">
            Counter QR
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[var(--ramkin-cream)]/50">
            Staff scan this code to look you up — never used to self-stamp.
          </p>
          <div className="mt-5 flex justify-center">
            <CustomerQr token={progress.qrToken} />
          </div>
        </section>
      ) : null}

      <nav className="mt-8 flex gap-4 text-sm">
        <Link to="/profile" className="text-[var(--ramkin-gold)] hover:underline">
          Profile
        </Link>
        <Link to="/" className="text-[var(--ramkin-cream)]/50 hover:text-[var(--ramkin-gold)]">
          Home
        </Link>
      </nav>
    </main>
  );
}
