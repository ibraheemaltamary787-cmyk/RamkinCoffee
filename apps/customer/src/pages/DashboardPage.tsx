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

function statusTone(progress: LoyaltyProgressDto | null): string {
  if (!progress) return 'text-[var(--ramkin-mist)]/55';
  if (progress.comboStatus === 'reward_approved') return 'text-[var(--ramkin-gold)]';
  if (progress.comboStatus === 'completed' || progress.comboStatus === 'reward_pending') {
    return 'text-[var(--ramkin-gold-soft)]';
  }
  return 'text-[var(--ramkin-mist)]/55';
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
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 text-center">
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
  const identity = displayName || user.email || user.phoneNumber || 'Guest';

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p
              className="truncate text-xl tracking-[0.16em] text-[var(--ramkin-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {BRAND.name}
            </p>
            <p className="text-xs tracking-[0.12em] text-[var(--ramkin-mist)]/50 uppercase">
              Loyalty
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="shrink-0 text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)]/80 uppercase transition hover:text-[var(--ramkin-gold)]"
        >
          Sign out
        </button>
      </header>

      <section className="animate-fade-up border border-[var(--ramkin-line)] bg-black/45 p-5 sm:p-6">
        <p className="text-sm text-[var(--ramkin-mist)]/55">Welcome</p>
        <h1
          className="mt-1 truncate text-2xl text-[var(--ramkin-mist)] sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {identity}
        </h1>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <p
              className="text-4xl text-[var(--ramkin-gold)] sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {purchaseCount}
              <span className="text-lg text-[var(--ramkin-gold-soft)]/65"> / {required}</span>
            </p>
            <p className={`max-w-[14rem] text-right text-xs leading-relaxed ${statusTone(progress)}`}>
              {progress ? statusLabel(progress) : 'Loading stamp card…'}
            </p>
          </div>

          <div className="mt-5 h-2.5 w-full overflow-hidden bg-white/6">
            <div
              key={`${purchaseCount}-${required}`}
              className="stamp-bar-fill animate-gold-sheen h-full bg-[var(--ramkin-gold)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs tracking-[0.14em] text-[var(--ramkin-gold-soft)]/65 uppercase">
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
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2.5 text-xs tracking-[0.18em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)] disabled:opacity-50"
            >
              {busy ? 'Requesting…' : 'Request reward'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refresh()}
            className="border border-white/15 px-4 py-2.5 text-xs tracking-[0.18em] text-[var(--ramkin-mist)]/70 uppercase transition hover:border-[var(--ramkin-gold)]/40 hover:text-[var(--ramkin-gold)]"
          >
            Refresh
          </button>
        </div>
      </section>

      {progress?.qrToken ? (
        <section
          className="animate-fade-up mt-6 border border-white/10 bg-black/30 p-5 text-center sm:mt-8 sm:p-6"
          style={{ animationDelay: '100ms' }}
        >
          <h2 className="text-xs tracking-[0.22em] text-[var(--ramkin-gold-soft)] uppercase">
            Counter QR
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[var(--ramkin-mist)]/48">
            Staff scan this code to look you up — never used to self-stamp.
          </p>
          <div className="mt-5 flex justify-center">
            <CustomerQr token={progress.qrToken} />
          </div>
        </section>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-5 text-sm">
        <Link to="/history" className="text-[var(--ramkin-gold)] hover:underline">
          History
        </Link>
        <Link to="/rewards" className="text-[var(--ramkin-gold)] hover:underline">
          Rewards
        </Link>
        <Link to="/profile" className="text-[var(--ramkin-gold)] hover:underline">
          Profile
        </Link>
        <Link to="/" className="text-[var(--ramkin-mist)]/45 hover:text-[var(--ramkin-gold)]">
          Home
        </Link>
      </nav>
    </main>
  );
}
