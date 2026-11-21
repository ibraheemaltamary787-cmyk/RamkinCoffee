import { useEffect, useState } from 'react';
import { canUpdateLoyaltySettings } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { callGetLoyaltySettings, callUpdateLoyaltySettings } from '../services/callables';

export function SettingsPage() {
  const { role } = useAuth();
  const [purchasesRequired, setPurchasesRequired] = useState(9);
  const [staffCanApproveRewards, setStaffCanApproveRewards] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const canEdit = canUpdateLoyaltySettings(role);

  useEffect(() => {
    void (async () => {
      try {
        const result = await callGetLoyaltySettings();
        setPurchasesRequired(result.settings.purchasesRequired);
        setStaffCanApproveRewards(result.settings.staffCanApproveRewards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load settings.');
      }
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const result = await callUpdateLoyaltySettings({
        purchasesRequired,
        staffCanApproveRewards,
      });
      setPurchasesRequired(result.settings.purchasesRequired);
      setStaffCanApproveRewards(result.settings.staffCanApproveRewards);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-fade-up max-w-lg">
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Loyalty settings
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-mist)]/60">
        Default is buy 9, 10th free. Changing N only affects <em>new</em> combos (snapshot on
        start).
      </p>

      <form onSubmit={(e) => void onSave(e)} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-xs tracking-[0.2em] text-[var(--ramkin-mist)]/45 uppercase">
            Purchases required (N)
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={purchasesRequired}
            disabled={!canEdit || busy}
            onChange={(e) => setPurchasesRequired(Number(e.target.value))}
            className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]/50 disabled:opacity-60"
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-[var(--ramkin-mist)]/75">
          <input
            type="checkbox"
            checked={staffCanApproveRewards}
            disabled={!canEdit || busy}
            onChange={(e) => setStaffCanApproveRewards(e.target.checked)}
          />
          Allow STAFF to approve / reject rewards
        </label>

        {canEdit ? (
          <button
            type="submit"
            disabled={busy}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)]/10 px-4 py-2 text-xs tracking-[0.2em] text-[var(--ramkin-gold)] uppercase disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        ) : (
          <p className="text-xs text-[var(--ramkin-mist)]/45">
            Only OWNER can change these values.
          </p>
        )}
      </form>

      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}
      {saved ? (
        <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">Settings saved.</p>
      ) : null}
    </section>
  );
}
