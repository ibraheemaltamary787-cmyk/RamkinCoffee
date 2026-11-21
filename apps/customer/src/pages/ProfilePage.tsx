import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { callUpdateCustomerProfile } from '../services/callables';

export function ProfilePage() {
  const { loading, user, displayName, configured, refreshClaims } = useAuth();
  const [name, setName] = useState(displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(displayName ?? '');
  }, [displayName]);

  if (!configured) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5 text-center text-[var(--ramkin-gold-soft)]">
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
      setError(
        err instanceof Error
          ? err.message
          : 'Update failed. Use Functions emulator or deploy Functions first.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center gap-3">
        <BrandMark size="sm" />
        <div>
          <h1
            className="text-2xl tracking-[0.14em] text-[var(--ramkin-gold)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Profile
          </h1>
          <p className="mt-1 text-sm text-[var(--ramkin-mist)]/50">
            Safe fields only — email, phone, and role are not client-editable.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void onSave(e)} className="animate-fade-up space-y-4">
        <label className="block text-sm text-[var(--ramkin-mist)]/80">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/45 px-4 py-3 outline-none transition focus:border-[var(--ramkin-gold)]"
            required
          />
        </label>
        <label className="block text-sm text-[var(--ramkin-mist)]/50">
          Email
          <input
            value={user.email ?? '—'}
            readOnly
            className="mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-[var(--ramkin-mist)]/55"
          />
        </label>
        <label className="block text-sm text-[var(--ramkin-mist)]/50">
          Phone
          <input
            value={user.phoneNumber ?? 'Not linked'}
            readOnly
            className="mt-2 w-full border border-white/10 bg-black/20 px-4 py-3 text-[var(--ramkin-mist)]/55"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-6 py-3 text-sm tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)] disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300/90">{error}</p> : null}

      <Link
        to="/dashboard"
        className="mt-8 inline-block text-sm text-[var(--ramkin-gold)] hover:underline"
      >
        ← Dashboard
      </Link>
    </main>
  );
}
