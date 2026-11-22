import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RecaptchaVerifier,
  signInWithCustomToken,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { BRAND, DEV_FAKE_OTP_CODE, isE164Phone, toE164Phone } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { callDevFakeOtpSignIn } from '../services/callables';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  isUsingFirebaseEmulators,
} from '../services/firebase';

interface PhoneAuthPageProps {
  mode: 'login' | 'register';
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
  const usingEmulators = isUsingFirebaseEmulators();
  const fakeOtp = isDevFakeOtpEnabled();

  useEffect(() => {
    if (user && step === 'phone') {
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
        'Firebase is not configured yet. Add VITE_FIREBASE_* to apps/customer/.env and enable emulators for Fake OTP.',
      );
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('Enter your name to register.');
      return;
    }

    const e164 = toE164Phone(phone);
    if (!isE164Phone(e164)) {
      setError('Enter a valid phone in E.164 format, e.g. +9627XXXXXXXX.');
      return;
    }

    if (fakeOtp) {
      setPhone(e164);
      setStep('code');
      setMessage(`DEV OTP mode: enter ${DEV_FAKE_OTP_CODE} (no SMS).`);
      return;
    }

    setBusy(true);
    try {
      const verifier = await ensureVerifier();
      confirmationRef.current = await signInWithPhoneNumber(getFirebaseAuth(), e164, verifier);
      setStep('code');
      setMessage(
        usingEmulators
          ? 'OTP sent. Copy the code from the emulators terminal (Auth emulator — no SMS).'
          : 'OTP sent. Enter the SMS code (or a Console test number).',
      );
    } catch (err) {
      verifierRef.current?.clear();
      verifierRef.current = null;
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send OTP. Prefer DEV Fake OTP with emulators on Spark.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyFakeOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!isDevFakeOtpEnabled()) {
        throw new Error('Development Fake OTP is disabled in this build.');
      }
      const e164 = toE164Phone(phone);
      const result = await callDevFakeOtpSignIn(
        mode === 'register'
          ? {
              mode: 'register',
              identifier: e164,
              otp: code.trim(),
              displayName: displayName.trim(),
            }
          : {
              mode: 'login',
              identifier: e164,
              otp: code.trim(),
            },
      );
      await signInWithCustomToken(getFirebaseAuth(), result.customToken);
      await ensureProfile(mode === 'register' ? displayName.trim() : undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code or profile setup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    if (fakeOtp) {
      await verifyFakeOtp(e);
      return;
    }

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
          {fakeOtp ? 'Phone · DEV Fake OTP' : 'Phone OTP · optional'}
        </p>
        {fakeOtp ? (
          <p className="mt-3 max-w-sm border border-amber-500/35 bg-amber-950/50 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
            Development Fake OTP is on. Use code <strong>{DEV_FAKE_OTP_CODE}</strong> after entering
            your mobile. Production builds reject this path.
          </p>
        ) : (
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-[var(--ramkin-mist)]/50">
            Spark keep-free uses Email/Password by default. Phone OTP is for Auth Emulator or Console
            test numbers only — no production SMS.
          </p>
        )}
      </div>

      {step === 'phone' ? (
        <form
          onSubmit={(e) => void sendCode(e)}
          className="animate-fade-up space-y-4"
          style={{ animationDelay: '80ms' }}
        >
          {mode === 'register' && (
            <label className="block text-left text-sm text-[var(--ramkin-mist)]/80">
              Name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-[var(--ramkin-mist)] outline-none focus:border-[var(--ramkin-gold)]"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="block text-left text-sm text-[var(--ramkin-mist)]/80">
            Phone (E.164)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9627XXXXXXXX"
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 text-[var(--ramkin-mist)] outline-none focus:border-[var(--ramkin-gold)]"
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
            {busy ? 'Sending…' : fakeOtp ? 'Continue' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void verifyCode(e)} className="animate-fade-up space-y-4">
          <label className="block text-left text-sm text-[var(--ramkin-mist)]/80">
            Verification code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={fakeOtp ? DEV_FAKE_OTP_CODE : undefined}
              className="mt-2 w-full border border-[var(--ramkin-gold)]/30 bg-black/40 px-4 py-3 tracking-[0.3em] text-[var(--ramkin-mist)] outline-none focus:border-[var(--ramkin-gold)]"
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

      <p className="mt-8 text-center text-sm text-[var(--ramkin-mist)]/50">
        {mode === 'register' ? (
          <>
            Already registered?{' '}
            <Link to="/login/phone" className="text-[var(--ramkin-gold)] hover:underline">
              Sign in with phone
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link to="/register/phone" className="text-[var(--ramkin-gold)] hover:underline">
              Register with phone
            </Link>
          </>
        )}
        {' · '}
        <Link
          to={mode === 'register' ? '/register/email' : '/login/email'}
          className="text-[var(--ramkin-gold)]/70 hover:underline"
        >
          Email
        </Link>
        {' · '}
        <Link to="/" className="text-[var(--ramkin-gold)]/70 hover:underline">
          Home
        </Link>
      </p>
    </main>
  );
}
