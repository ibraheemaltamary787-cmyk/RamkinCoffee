import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { BRAND } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';

interface PhoneAuthPageProps {
  mode: 'login' | 'register';
}

function normalizeE164(raw: string): string {
  const trimmed = raw.trim().replace(/[\s()-]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  return `+${trimmed}`;
}

export function PhoneAuthPage({ mode }: PhoneAuthPageProps) {
  const navigate = useNavigate();
  const { ensureProfile, user, configured } = useAuth();
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (user && step === 'phone') {
      // Already signed in — send to dashboard.
      navigate('/dashboard', { replace: true });
    }
  }, [user, step, navigate]);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  async function ensureVerifier(): Promise<RecaptchaVerifier> {
    if (verifierRef.current) return verifierRef.current;
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    verifierRef.current = verifier;
    await verifier.render();
    return verifier;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!configured || !isFirebaseConfigured()) {
      setError(
        'Firebase is not configured yet. Add VITE_FIREBASE_* to apps/customer/.env from a new RAMKIN project, enable Phone Auth (or use Emulators with VITE_USE_FIREBASE_EMULATORS=true).',
      );
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('Enter your name to register.');
      return;
    }

    const e164 = normalizeE164(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
      setError('Enter a valid phone in E.164 format, e.g. +9627XXXXXXXX.');
      return;
    }

    setBusy(true);
    try {
      const verifier = await ensureVerifier();
      confirmationRef.current = await signInWithPhoneNumber(getFirebaseAuth(), e164, verifier);
      setStep('code');
      setMessage('OTP sent. Enter the code from SMS (or Emulator test number).');
    } catch (err) {
      verifierRef.current?.clear();
      verifierRef.current = null;
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send OTP. Confirm Phone Auth / test numbers / Emulator.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmationRef.current) {
      setError('Request a new code first.');
      return;
    }
    setBusy(true);
    try {
      await confirmationRef.current.confirm(code.trim());
      await ensureProfile(mode === 'register' ? displayName.trim() : undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code or profile setup failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="animate-fade-up mb-8 flex flex-col items-center text-center">
        <BrandMark size="md" />
        <h1
          className="mt-6 text-3xl tracking-[0.18em] text-[var(--ramkin-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {BRAND.name}
        </h1>
        <p className="mt-2 text-xs tracking-[0.3em] text-[var(--ramkin-gold-soft)]/70 uppercase">
          {mode === 'register' ? 'Create account' : 'Welcome back'}
        </p>
      </div>

      {step === 'phone' ? (
        <form
          onSubmit={sendCode}
          className="animate-fade-up space-y-4"
          style={{ animationDelay: '80ms' }}
        >
          {mode === 'register' && (
            <label className="block text-left text-sm text-[var(--ramkin-cream)]/80">
              Name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-[var(--ramkin-cream)] outline-none focus:border-[var(--ramkin-gold)]"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="block text-left text-sm text-[var(--ramkin-cream)]/80">
            Phone (E.164)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9627XXXXXXXX"
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-[var(--ramkin-cream)] outline-none focus:border-[var(--ramkin-gold)]"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm font-medium tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="animate-fade-up space-y-4">
          <label className="block text-left text-sm text-[var(--ramkin-cream)]/80">
            Verification code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 tracking-[0.3em] text-[var(--ramkin-cream)] outline-none focus:border-[var(--ramkin-gold)]"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] py-3 text-sm font-medium tracking-[0.2em] text-black uppercase disabled:opacity-60"
          >
            {busy ? 'Verifying…' : mode === 'register' ? 'Verify & register' : 'Verify & log in'}
          </button>
          <button
            type="button"
            className="w-full text-sm text-[var(--ramkin-gold-soft)]/70 underline-offset-4 hover:underline"
            onClick={() => {
              setStep('phone');
              setCode('');
              confirmationRef.current = null;
            }}
          >
            Use a different number
          </button>
        </form>
      )}

      <div id="recaptcha-container" />

      {message && <p className="mt-4 text-sm text-[var(--ramkin-gold-soft)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <p className="mt-8 text-center text-sm text-[var(--ramkin-cream)]/50">
        {mode === 'register' ? (
          <>
            Already a member?{' '}
            <Link to="/login" className="text-[var(--ramkin-gold)] hover:underline">
              Log in
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
    </main>
  );
}
