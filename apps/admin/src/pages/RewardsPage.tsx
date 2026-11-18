import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  callApproveReward,
  callListOpenRewards,
  callRedeemReward,
  callRejectReward,
} from '../services/callables';

type OpenReward = {
  requestId: string;
  customerId: string;
  comboId: string;
  status: string;
  requestedAt: string | null;
  displayName: string | null;
  phone: string | null;
  purchaseCount: number;
  requiredPurchases: number;
};

export function RewardsPage() {
  const [filter, setFilter] = useState<'all' | 'requested' | 'approved'>('all');
  const [rewards, setRewards] = useState<OpenReward[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await callListOpenRewards(filter === 'all' ? undefined : filter);
      setRewards(result.rewards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load rewards.');
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Rewards queue
          </h1>
          <p className="mt-2 text-sm text-[var(--ramkin-cream)]/60">
            Approve / reject requests. Redeem only after the free drink is given — that alone resets
            the combo. STAFF approve/reject is gated by loyalty settings + server RBAC.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="border border-white/15 px-3 py-2 text-xs tracking-[0.18em] uppercase hover:border-[var(--ramkin-gold)]/40"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['all', 'Open'],
            ['requested', 'Requested'],
            ['approved', 'Approved'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-xs tracking-[0.15em] uppercase ${
              filter === value
                ? 'border border-[var(--ramkin-gold)] text-[var(--ramkin-gold)]'
                : 'border border-white/15 text-[var(--ramkin-cream)]/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <ul className="mt-8 space-y-4">
        {rewards.length === 0 ? (
          <li className="border border-white/10 bg-black/20 p-4 text-sm text-[var(--ramkin-cream)]/50">
            No open reward requests.
          </li>
        ) : (
          rewards.map((reward) => (
            <li key={reward.requestId} className="border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/app/customers/${reward.customerId}`}
                    className="text-[var(--ramkin-cream)] hover:text-[var(--ramkin-gold)]"
                  >
                    {reward.displayName ?? 'Customer'} · {reward.phone ?? '—'}
                  </Link>
                  <p className="mt-1 text-xs tracking-[0.15em] text-[var(--ramkin-gold-soft)]/70 uppercase">
                    {reward.status} · {reward.purchaseCount}/{reward.requiredPurchases} stamps
                  </p>
                  <p className="mt-1 text-xs text-[var(--ramkin-cream)]/40">
                    {reward.requestedAt ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reward.status === 'requested' ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(() => callApproveReward({ requestId: reward.requestId }))
                        }
                        className="border border-[var(--ramkin-gold)]/60 px-3 py-1.5 text-xs tracking-[0.15em] text-[var(--ramkin-gold)] uppercase"
                      >
                        Approve
                      </button>
                      <input
                        value={rejectReasons[reward.requestId] ?? ''}
                        onChange={(e) =>
                          setRejectReasons((prev) => ({
                            ...prev,
                            [reward.requestId]: e.target.value,
                          }))
                        }
                        placeholder="Reason (required)"
                        className="border border-white/15 bg-black/40 px-2 py-1.5 text-sm outline-none"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const reason = (rejectReasons[reward.requestId] ?? '').trim();
                          if (reason.length < 3) {
                            setError('Rejection reason required (min 3 characters).');
                            return;
                          }
                          void run(() =>
                            callRejectReward({
                              requestId: reward.requestId,
                              reason,
                            }),
                          );
                        }}
                        className="border border-white/20 px-3 py-1.5 text-xs tracking-[0.15em] uppercase"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {reward.status === 'approved' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(() => callRedeemReward({ requestId: reward.requestId }))
                      }
                      className="border border-[var(--ramkin-gold)] px-3 py-1.5 text-xs tracking-[0.15em] text-[var(--ramkin-gold)] uppercase"
                    >
                      Confirm redeem
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
