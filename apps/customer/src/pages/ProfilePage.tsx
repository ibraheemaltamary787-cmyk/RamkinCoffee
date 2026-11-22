import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CustomerShell } from '../components/CustomerShell';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { callUpdateCustomerProfile } from '../services/callables';

export function ProfilePage() {
  const { loading, user, displayName, configured, refreshClaims, signOut } = useAuth();
  const { t } = useLocale();
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
      setMessage(t('profileUpdated'));
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
    <CustomerShell
      title={t('profileTitle')}
      subtitle={t('profileSub')}
      actions={
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-[10px] tracking-[0.16em] text-[var(--ramkin-gold-soft)]/80 uppercase hover:text-[var(--ramkin-gold)]"
        >
          {t('signOut')}
        </button>
      }
    >
      <form onSubmit={(e) => void onSave(e)} className="animate-fade-up space-y-4">
        <label className="block text-sm text-[var(--ramkin-mist)]/80">
          {t('displayName')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-[var(--ramkin-mist)] outline-none focus:border-[var(--ramkin-gold)]"
            autoComplete="name"
            required
          />
        </label>
        <p className="text-xs text-[var(--ramkin-mist)]/45">
          {t('phone')}: {user.phoneNumber ?? '—'}
        </p>
        <p className="text-xs text-[var(--ramkin-mist)]/45">
          {t('email')}: {user.email ?? '—'}
        </p>
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm font-medium tracking-[0.2em] text-black uppercase disabled:opacity-60"
        >
          {busy ? t('saving') : t('save')}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </CustomerShell>
  );
}
