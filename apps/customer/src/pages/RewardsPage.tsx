import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { MyRewardRequestDto } from '@ramkin/shared';
import { CustomerShell } from '../components/CustomerShell';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callListMyRewardRequests, callRequestReward, callGetLoyaltyProgress } from '../services/callables';

function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en');
  } catch {
    return iso;
  }
}

export function RewardsPage() {
  const { loading, user, configured } = useAuth();
  const { t, locale } = useLocale();
  const [requests, setRequests] = useState<MyRewardRequestDto[]>([]);
  const [canRequest, setCanRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [rewardResult, progressResult] = await Promise.all([
        callListMyRewardRequests({ limit: 40 }),
        callGetLoyaltyProgress(),
      ]);
      setRequests(rewardResult.requests);
      setCanRequest(
        progressResult.progress.rewardEligible === true &&
          !progressResult.progress.openRewardRequestId,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reward requests.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!configured || !user) return;
    void refresh();
  }, [configured, user, refresh]);

  async function onRequest() {
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

  function statusLabel(status: MyRewardRequestDto['status']): string {
    switch (status) {
      case 'requested':
        return t('awaitingApproval');
      case 'approved':
        return t('approvedRedeem');
      case 'rejected':
        return t('rejected');
      case 'redeemed':
        return t('redeemed');
      default:
        return status;
    }
  }

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
    <CustomerShell title={t('rewardsTitle')} subtitle={t('rewardsSub')}>
      {canRequest ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onRequest()}
          className="mb-6 w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-xs tracking-[0.18em] text-black uppercase disabled:opacity-50"
        >
          {busy ? t('requesting') : t('requestReward')}
        </button>
      ) : null}

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

      {error ? <p className="mb-4 text-sm text-red-300/90">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p> : null}

      {requests.length === 0 && !busy ? (
        <p className="border border-white/10 bg-black/30 px-4 py-6 text-sm text-[var(--ramkin-mist)]/55">
          {t('noRewardsYet')}
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.requestId}
              className="animate-fade-up border border-[var(--ramkin-line)] bg-black/40 px-4 py-3"
            >
              <p className="text-sm text-[var(--ramkin-gold)]">{statusLabel(r.status)}</p>
              <p className="mt-1 text-xs text-[var(--ramkin-mist)]/50">
                {formatWhen(r.requestedAt, locale)}
              </p>
              {r.rejectedReason ? (
                <p className="mt-2 text-xs text-red-300/80">{r.rejectedReason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </CustomerShell>
  );
}
