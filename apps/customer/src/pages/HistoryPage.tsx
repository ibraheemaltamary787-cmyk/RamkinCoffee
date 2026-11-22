import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { MyPurchaseDto } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { callListMyPurchases } from '../services/callables';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function HistoryPage() {
  const { loading, user, configured } = useAuth();
  const [purchases, setPurchases] = useState<MyPurchaseDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await callListMyPurchases({ limit: 40 });
      setPurchases(result.purchases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load purchase history.');
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
            Purchase history
          </h1>
          <p className="mt-1 text-sm text-[var(--ramkin-mist)]/50">
            Staff-recorded stamps only — you cannot add purchases yourself.
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

      {purchases.length === 0 && !busy ? (
        <p className="border border-white/10 bg-black/30 px-4 py-6 text-sm text-[var(--ramkin-mist)]/55">
          No purchases yet. Visit a RAMKIN counter — staff will stamp your card.
        </p>
      ) : (
        <ul className="space-y-3">
          {purchases.map((p) => (
            <li
              key={p.purchaseId}
              className="animate-fade-up border border-[var(--ramkin-line)] bg-black/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--ramkin-mist)]/85">{formatWhen(p.createdAt)}</p>
                  {p.note ? (
                    <p className="mt-1 text-xs text-[var(--ramkin-mist)]/45">{p.note}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm text-[var(--ramkin-gold)]">
                  {p.amount != null ? p.amount.toFixed(2) : 'Stamp'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav className="mt-8 flex flex-wrap gap-5 text-sm">
        <Link to="/dashboard" className="text-[var(--ramkin-gold)] hover:underline">
          Dashboard
        </Link>
        <Link to="/rewards" className="text-[var(--ramkin-gold)]/80 hover:underline">
          Rewards
        </Link>
        <Link to="/profile" className="text-[var(--ramkin-mist)]/45 hover:text-[var(--ramkin-gold)]">
          Profile
        </Link>
      </nav>
    </main>
  );
}
