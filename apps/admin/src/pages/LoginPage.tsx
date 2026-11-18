import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BRAND } from '@ramkin/shared';
import { useAuth } from '../auth/AuthContext';
import { callAcceptStaffInvite } from '../services/callables';

export function LoginPage() {
  const { configured, loading, user, isStaff, signIn, refreshClaims } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  if (!loading && user && isStaff) {
    return <Navigate to="/app" replace />;
  }

  async function tryAcceptInvite(): Promise<boolean> {
    try {
      const result = await callAcceptStaffInvite({});
      await refreshClaims();
      setInviteNote(`Invite accepted — role ${result.role}.`);
      return true;
    } catch {
      return false;
    }
  }

  if (!loading && user && !isStaff) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12 text-center">
        <img
          src="/brand/ramkin-logo.jpg"
          alt=""
          className="mx-auto mb-4 h-14 w-14 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
        />
        <h1
          className="text-xl text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Almost there
        </h1>
        <p className="mt-3 text-sm text-[var(--ramkin-cream)]/65">
          This account has no staff role yet. Accept a pending invite for your email, or complete
          OWNER bootstrap.
        </p>
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
                  setError('No pending invite for this email.');
                }
              })();
            }}
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            Accept staff invite
          </button>
          <button
            type="button"
            onClick={() => navigate('/bootstrap')}
            className="border border-white/20 py-3 text-sm tracking-[0.2em] uppercase"
          >
            Go to bootstrap
          </button>
        </div>
        {inviteNote ? (
          <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{inviteNote}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </main>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!configured) {
        setError(
          'Firebase placeholders only. Copy .env.example → apps/admin/.env and fill VITE_FIREBASE_* from a new RAMKIN project (never hloe-45d43).',
        );
        return;
      }
      const nextRole = await signIn(email, password);
      if (nextRole && ['OWNER', 'MANAGER', 'STAFF'].includes(nextRole)) {
        navigate('/app', { replace: true });
        return;
      }
      const accepted = await tryAcceptInvite();
      navigate(accepted ? '/app' : '/bootstrap', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(201,169,98,0.2), transparent 55%)',
        }}
        aria-hidden
      />
      <div className="relative mb-8 text-center">
        <img
          src="/brand/ramkin-logo.jpg"
          alt={`${BRAND.name} logo`}
          className="mx-auto mb-4 h-16 w-16 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
        />
        <h1
          className="text-3xl tracking-[0.18em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {BRAND.name}
        </h1>
        <p className="mt-2 text-xs tracking-[0.35em] text-[var(--ramkin-gold-soft)]/70 uppercase">
          Staff &amp; Admin
        </p>
      </div>

      {!configured && (
        <p className="relative mb-4 border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-sm text-[var(--ramkin-gold-soft)]">
          Waiting on real Firebase web config. Email/password Auth wiring is ready once env +
          console providers are set.
        </p>
      )}

      <form onSubmit={onSubmit} className="relative space-y-4">
        <label className="block text-sm text-[var(--ramkin-cream)]/80">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm text-[var(--ramkin-cream)]/80">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 outline-none focus:border-[var(--ramkin-gold)]"
            autoComplete="current-password"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm tracking-[0.2em] text-black uppercase disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {error && <p className="relative mt-4 text-sm text-red-300">{error}</p>}

      <p className="relative mt-8 text-center text-xs leading-relaxed text-[var(--ramkin-cream)]/45">
        First OWNER: create email user in Console, set <code>BOOTSTRAP_OWNER_SECRET</code>, then
        call <code>bootstrapOwner</code>. Invited staff sign in here and accept their invite.
      </p>
    </main>
  );
}
