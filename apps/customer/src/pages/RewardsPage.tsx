import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { MyRewardRequestDto } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { callListMyRewardRequests } from '../services/callables';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusLabel(status: MyRewardRequestDto['status']): string {
  switch (status) {
    case 'requested':
      return 'Awaiting approval';
    case 'approved':
      return 'Approved — redeem at counter';
    case 'rejected':
      return 'Rejected';
    case 'redeemed':
      return 'Redeemed';
    default:
      return status;
  }
}

export function RewardsPage() {
  const { loading, user, configured } = useAuth();
  const [requests, setRequests] = useState<MyRewardRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListMyRewardRequests({ limit: 40 });
      setRequests(result.requests);
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

  if (!configured) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 text-[var(--ramkin-gold-soft)]">
        Firebase not configured.
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
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center gap-3">
        <BrandMark size="sm" />
        <div>
          <h1
            className="text-2xl tracking-[0.14em] text-[var(--ramkin-gold)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reward requests
          </h1>
          <p className="mt-1 text-sm text-[var(--ramkin-mist)]/50">
            Request from the dashboard when your combo is complete. Combo resets only after
            redemption.
          </p>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-300/90">{error}</p> : null}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="text-xs tracking-[0.18em] text-[var(--ramkin-gold-soft)]/80 uppercase hover:text-[var(--ramkin-gold)] disabled:opacity-50"
        >
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {requests.length === 0 && !busy ? (
        <p className="border border-white/10 bg-black/30 px-4 py-6 text-sm text-[var(--ramkin-mist)]/55">
          No reward requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r.requestId}
              className="animate-fade-up border border-[var(--ramkin-line)] bg-black/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--ramkin-gold)]">{statusLabel(r.status)}</p>
                  <p className="mt-1 text-xs text-[var(--ramkin-mist)]/45">
                    Requested {formatWhen(r.requestedAt)}
                  </p>
                  {r.status === 'rejected' && r.rejectedReason ? (
                    <p className="mt-2 text-xs text-red-300/80">Reason: {r.rejectedReason}</p>
                  ) : null}
                  {r.redeemedAt ? (
                    <p className="mt-1 text-xs text-[var(--ramkin-mist)]/45">
                      Redeemed {formatWhen(r.redeemedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav className="mt-8 flex flex-wrap gap-5 text-sm">
        <Link to="/dashboard" className="text-[var(--ramkin-gold)] hover:underline">
          Dashboard
        </Link>
        <Link to="/history" className="text-[var(--ramkin-gold)]/80 hover:underline">
          History
        </Link>
        <Link to="/profile" className="text-[var(--ramkin-mist)]/45 hover:text-[var(--ramkin-gold)]">
          Profile
        </Link>
      </nav>
    </main>
  );
}
