import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { callUpdateCustomerProfile } from '../services/callables';

export function ProfilePage() {
  const { loading, user, displayName, configured, refreshClaims } = useAuth();
  const [name, setName] = useState(displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-center text-[var(--ramkin-gold-soft)]">
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await callUpdateCustomerProfile({ displayName: name.trim() });
      setName(result.profile.displayName);
      setMessage('Profile updated.');
      await refreshClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Deploy Functions first.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-10">
      <h1
        className="text-3xl tracking-[0.12em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Profile
      </h1>
      <p className="mt-2 text-sm text-[var(--ramkin-cream)]/55">
        Safe fields only — phone and role are not client-editable.
      </p>

      <form onSubmit={onSave} className="mt-8 space-y-4">
        <label className="block text-sm text-[var(--ramkin-cream)]/80">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
            required
          />
        </label>
        <label className="block text-sm text-[var(--ramkin-cream)]/50">
          Phone
          <input
            value={user.phoneNumber ?? ''}
            readOnly
            className="mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-[var(--ramkin-cream)]/60"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-6 py-3 text-sm tracking-[0.2em] text-black uppercase disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <Link to="/dashboard" className="mt-8 inline-block text-sm text-[var(--ramkin-gold)] hover:underline">
        ← Dashboard
      </Link>
    </main>
  );
}
