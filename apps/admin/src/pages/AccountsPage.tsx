import { useState } from 'react';
import { canDisableAccounts, canManageStaffRoles } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { callDisableAccount, callSetStaffRole } from '../services/callables';

export function AccountsPage() {
  const { role, refreshClaims } = useAuth();
  const [staffUid, setStaffUid] = useState('');
  const [staffRole, setStaffRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [disableUid, setDisableUid] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSetRole(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await callSetStaffRole({ uid: staffUid.trim(), role: staffRole });
      setMessage(`Role ${result.role} set for ${result.uid}. They must refresh their token.`);
      await refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'setStaffRole failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDisable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await callDisableAccount({ uid: disableUid.trim(), disabled: true });
      setMessage(`Account ${result.uid} → ${result.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'disableAccount failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-10">
      <div>
        <h1
          className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Accounts
        </h1>
        <p className="mt-2 text-sm text-[var(--ramkin-cream)]/60">
          OWNER grants MANAGER/STAFF. OWNER/MANAGER may disable accounts. Server rejects unauthorized
          callers.
        </p>
      </div>

      {canManageStaffRoles(role) && (
        <form onSubmit={onSetRole} className="max-w-lg space-y-3 border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            Set staff role
          </h2>
          <input
            value={staffUid}
            onChange={(e) => setStaffUid(e.target.value)}
            placeholder="Auth UID"
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]"
            required
          />
          <select
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value as 'MANAGER' | 'STAFF')}
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="STAFF">STAFF</option>
            <option value="MANAGER">MANAGER</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2 text-xs tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            Assign role
          </button>
        </form>
      )}

      {canDisableAccounts(role) && (
        <form onSubmit={onDisable} className="max-w-lg space-y-3 border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm tracking-[0.2em] text-[var(--ramkin-gold-soft)] uppercase">
            Disable account
          </h2>
          <input
            value={disableUid}
            onChange={(e) => setDisableUid(e.target.value)}
            placeholder="Auth UID"
            className="w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="border border-red-400/60 px-4 py-2 text-xs tracking-[0.2em] text-red-200 uppercase disabled:opacity-60"
          >
            Disable
          </button>
        </form>
      )}

      {message && <p className="text-sm text-[var(--ramkin-gold-soft)]">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </section>
  );
}
