import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BRAND, DEV_FAKE_OTP_CODE } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { useLocale } from '../i18n/LocaleContext';
import { callAcceptStaffInvite } from '../services/callables';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';

export function LoginPage() {
  const { configured, loading, user, isStaff, signIn, signInWithFakeOtp, refreshClaims } =
    useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const fakeOtp = isDevFakeOtpEnabled();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('owner@ramkin.local');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(!fakeOtp);

  if (!loading && user && isStaff) {
    return <Navigate to="/app" replace />;
  }

  async function tryAcceptInvite(): Promise<boolean> {
    try {
      const result = await callAcceptStaffInvite({});
      await refreshClaims();
      setInviteNote(t('loginInviteAccepted', { role: result.role }));
      return true;
    } catch {
      return false;
    }
  }

  if (!loading && user && !isStaff) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <div className="mb-6 flex justify-center">
          <LanguageSwitch />
        </div>
        <img
          src="/brand/ramkin-logo.jpg"
          alt=""
          className="mx-auto mb-4 h-14 w-14 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
        />
        <h1
          className="text-xl text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('loginAlmostThere')}
        </h1>
        <p className="mt-3 text-sm text-[var(--ramkin-mist)]/65">{t('loginNoStaffRole')}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                const ok = await tryAcceptInvite();
                setBusy(false);
                if (ok) {
                  navigate('/app', { replace: true });
                } else {
                  setError(t('loginNoInvite'));
                }
              })();
            }}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            {t('loginAcceptInvite')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/bootstrap')}
            className="border border-white/20 py-3 text-sm tracking-[0.2em] uppercase"
          >
            {t('loginGoBootstrap')}
          </button>
        </div>
        {inviteNote ? (
          <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{inviteNote}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </main>
    );
  }

  async function finishStaffNav(nextRole: string | null) {
    if (nextRole && ['OWNER', 'MANAGER', 'STAFF'].includes(nextRole)) {
      navigate('/app', { replace: true });
      return;
    }
    const accepted = await tryAcceptInvite();
    navigate(accepted ? '/app' : '/bootstrap', { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!configured) {
        setError(t('loginFirebaseMissing'));
        return;
      }

      if (fakeOtp && !usePassword) {
        const nextRole = await signInWithFakeOtp(identifier, otp);
        await finishStaffNav(nextRole);
        return;
      }

      const nextRole = await signIn(email, password);
      await finishStaffNav(nextRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.22), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(92,48,22,0.25), transparent 45%)',
        }}
        aria-hidden
      />
      <div className="relative mb-6 flex justify-end">
        <LanguageSwitch />
      </div>
      <div className="relative mb-8 text-center">
        <img
          src="/brand/ramkin-logo.jpg"
          alt={`${BRAND.name} logo`}
          className="mx-auto mb-4 h-16 w-16 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
        />
        <h1
          className="text-3xl tracking-[0.18em] text-[var(--ramkin-gold)] animate-gold-sheen"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {BRAND.name}
        </h1>
        <p className="mt-2 text-xs tracking-[0.35em] text-[var(--ramkin-gold-soft)]/70 uppercase">
          {t('brandStaff')}
        </p>
      </div>

      {!configured ? (
        <p className="relative mb-4 border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-sm text-[var(--ramkin-gold-soft)]">
          {t('loginWaitingConfig')}
        </p>
      ) : null}

      {fakeOtp && !usePassword ? (
        <p className="relative mb-4 border border-amber-500/35 bg-amber-950/50 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
          {t('loginFakeOtpHint', { code: DEV_FAKE_OTP_CODE })}
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="relative space-y-4">
        {fakeOtp && !usePassword ? (
          <>
            <label className="block text-sm text-[var(--ramkin-mist)]/80">
              {t('loginIdentifier')}
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="owner@ramkin.local"
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
                autoComplete="username"
                required
              />
            </label>
            <label className="block text-sm text-[var(--ramkin-mist)]/80">
              {t('loginDevOtp')}
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={DEV_FAKE_OTP_CODE}
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 tracking-[0.3em] outline-none focus:border-[var(--ramkin-gold)]"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm text-[var(--ramkin-mist)]/80">
              {t('email')}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
                autoComplete="username"
                required
              />
            </label>
            <label className="block text-sm text-[var(--ramkin-mist)]/80">
              {t('loginPassword')}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
                autoComplete="current-password"
                required
              />
            </label>
          </>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm tracking-[0.2em] text-black uppercase disabled:opacity-60"
        >
          {busy ? t('loginSigningIn') : t('loginSignIn')}
        </button>
      </form>

      {fakeOtp ? (
        <button
          type="button"
          className="relative mt-4 w-full text-xs text-[var(--ramkin-gold-soft)]/70 underline-offset-4 hover:underline"
          onClick={() => {
            setUsePassword((v) => !v);
            setError(null);
          }}
        >
          {usePassword ? t('loginUseFakeOtp') : t('loginUsePassword')}
        </button>
      ) : null}

      {error && <p className="relative mt-4 text-sm text-red-300">{error}</p>}

      <p className="relative mt-8 text-center text-xs leading-relaxed text-[var(--ramkin-mist)]/45">
        {fakeOtp ? t('loginFooterFake') : t('loginFooterEmulator')}
      </p>
    </main>
  );
}
