import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { BRAND } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { getFirebaseAuth, isFirebaseConfigured, isUsingFirebaseEmulators } from '../services/firebase';

interface EmailAuthPageProps {
  mode: 'login' | 'register';
}

export function EmailAuthPage({ mode }: EmailAuthPageProps) {
  const navigate = useNavigate();
  const { ensureProfile, user, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usingEmulators = isUsingFirebaseEmulators();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!configured || !isFirebaseConfigured()) {
      setError(
        'Firebase is not configured. Copy .env.example → apps/customer/.env (Email/Password is enabled on Spark; use emulators for callables).',
      );
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('Enter your name to register.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
        await ensureProfile(displayName.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureProfile();
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,175,55,0.16), transparent 60%)',
        }}
        aria-hidden
      />

      <div className="animate-fade-up relative mb-8 flex flex-col items-center text-center">
        <BrandMark size="md" />
        <h1
          className="mt-6 text-3xl tracking-[0.2em] text-[var(--ramkin-gold)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {BRAND.name}
        </h1>
        <p className="mt-2 text-xs tracking-[0.32em] text-[var(--ramkin-gold-soft)]/75 uppercase">
          {mode === 'register' ? 'Create account' : 'Welcome back'}
        </p>
      </div>

      {usingEmulators ? (
        <p
          className="animate-fade-up relative mb-5 border border-[var(--ramkin-gold)]/25 bg-black/45 px-4 py-3 text-left text-xs leading-relaxed text-[var(--ramkin-mist)]/70"
          style={{ animationDelay: '40ms' }}
        >
          Emulator mode: register here, or add an Email/Password user in Emulator UI (
          <code className="text-[var(--ramkin-gold-soft)]">:4000</code>) then sign in. Callables hit
          Functions on <code className="text-[var(--ramkin-gold-soft)]">:5001</code> — no Blaze / SMS.
        </p>
      ) : null}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="animate-fade-up relative space-y-4"
        style={{ animationDelay: '80ms' }}
      >
        {mode === 'register' ? (
          <label className="block text-left text-sm text-[var(--ramkin-mist)]/85">
            Name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/45 px-4 py-3 text-[var(--ramkin-mist)] outline-none transition focus:border-[var(--ramkin-gold)]"
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="block text-left text-sm text-[var(--ramkin-mist)]/85">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/45 px-4 py-3 text-[var(--ramkin-mist)] outline-none transition focus:border-[var(--ramkin-gold)]"
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-left text-sm text-[var(--ramkin-mist)]/85">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/45 px-4 py-3 text-[var(--ramkin-mist)] outline-none transition focus:border-[var(--ramkin-gold)]"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
            minLength={6}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm font-medium tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)] disabled:opacity-60"
        >
          {busy
            ? mode === 'register'
              ? 'Creating…'
              : 'Signing in…'
            : mode === 'register'
              ? 'Register'
              : 'Sign in'}
        </button>
      </form>

      {error ? <p className="relative mt-4 text-sm text-red-300/90">{error}</p> : null}

      <p className="relative mt-8 text-center text-sm text-[var(--ramkin-mist)]/50">
        {mode === 'register' ? (
          <>
            Already a member?{' '}
            <Link to="/login" className="text-[var(--ramkin-gold)] hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link to="/register" className="text-[var(--ramkin-gold)] hover:underline">
              Register
            </Link>
          </>
        )}
        {' · '}
        <Link to="/" className="text-[var(--ramkin-gold)]/70 hover:underline">
          Home
        </Link>
      </p>

      {usingEmulators ? (
        <p className="relative mt-6 text-center text-xs text-[var(--ramkin-mist)]/40">
          Optional phone OTP (emulator code in terminal):{' '}
          <Link
            to={mode === 'register' ? '/register/phone' : '/login/phone'}
            className="text-[var(--ramkin-gold-soft)]/80 hover:underline"
          >
            Phone path
          </Link>
        </p>
      ) : null}
    </main>
  );
}
