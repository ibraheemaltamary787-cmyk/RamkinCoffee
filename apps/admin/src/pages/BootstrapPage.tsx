import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useLocale } from '../i18n/LocaleContext';
import { callBootstrapOwner } from '../services/callables';

/**
 * Signed-in email users without an OWNER yet use this one-shot path.
 * After an OWNER exists, the callable rejects further use.
 */
export function BootstrapPage() {
  const { refreshClaims, role, signOut, isStaff } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await callBootstrapOwner({ secret });
      await refreshClaims();
      setMessage(result.message);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bootstrapFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-6 flex justify-end">
        <LanguageSwitch />
      </div>
      <img
        src="/brand/ramkin-logo.jpg"
        alt={`${BRAND.name} logo`}
        className="mb-4 h-14 w-14 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
      />
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('bootstrapTitle')}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ramkin-mist)]/65">
        {t('bootstrapSub')}{' '}
        <span className="text-[var(--ramkin-gold)]">{role ?? t('none')}</span>
      </p>

      {isStaff ? (
        <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{t('bootstrapAlreadyStaff')}</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
          <label className="block text-sm text-[var(--ramkin-mist)]/80">
            {t('bootstrapSecret')}
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="BOOTSTRAP_OWNER_SECRET"
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--ramkin-gold)]"
              required
              minLength={16}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-4 py-2 text-xs tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            {busy ? t('bootstrapBusy') : t('bootstrapSubmit')}
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-8 flex gap-4 text-sm">
        {isStaff && (
          <Link to="/app" className="text-[var(--ramkin-gold)] hover:underline">
            {t('bootstrapGoApp')}
          </Link>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-[var(--ramkin-mist)]/50 hover:text-[var(--ramkin-gold)]"
        >
          {t('signOut')}
        </button>
      </div>
    </main>
  );
}
