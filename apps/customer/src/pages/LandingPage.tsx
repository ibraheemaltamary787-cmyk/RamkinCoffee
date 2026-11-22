import { Link } from 'react-router-dom';
import { BRAND, DEV_FAKE_OTP_CODE } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';
import { isUsingFirebaseEmulators } from '../services/firebase';

export function LandingPage() {
  const { user } = useAuth();
  const usingEmulators = isUsingFirebaseEmulators();
  const fakeOtp = isDevFakeOtpEnabled();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 15%, transparent 72%)',
        }}
        aria-hidden
      />

      <div className="animate-fade-up relative mb-8">
        <BrandMark size="lg" />
      </div>

      <h1
        className="animate-fade-up relative text-5xl font-semibold tracking-[0.22em] text-[var(--ramkin-gold)] sm:text-6xl"
        style={{ fontFamily: 'var(--font-display)', animationDelay: '70ms' }}
      >
        {BRAND.name}
      </h1>

      <p
        className="animate-fade-up animate-gold-sheen relative mt-4 max-w-md text-sm font-medium tracking-[0.38em] uppercase text-[var(--ramkin-gold-soft)]/85"
        style={{ animationDelay: '140ms' }}
      >
        {BRAND.tagline}
      </p>

      <p
        className="animate-fade-up relative mt-8 max-w-md text-base leading-relaxed text-[var(--ramkin-mist)]/68"
        style={{ animationDelay: '210ms' }}
      >
        Collect stamps toward your next free drink. Staff record every purchase — you track progress
        and request rewards when ready.
      </p>

      <div
        className="animate-fade-up relative mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        style={{ animationDelay: '280ms' }}
      >
        {user ? (
          <Link
            to="/dashboard"
            className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-8 py-3 text-sm font-medium tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)]"
          >
            Open dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="border border-[var(--ramkin-gold)] bg-[var(--ramkin-gold)] px-8 py-3 text-sm font-medium tracking-[0.2em] text-black uppercase transition hover:bg-[var(--ramkin-gold-soft)]"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="border border-[var(--ramkin-gold)]/45 px-8 py-3 text-sm font-medium tracking-[0.2em] text-[var(--ramkin-gold)] uppercase transition hover:border-[var(--ramkin-gold)] hover:bg-white/5"
            >
              Sign in
            </Link>
          </>
        )}
      </div>

      {fakeOtp && !user ? (
        <p
          className="animate-fade-up relative mt-8 max-w-sm border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs leading-relaxed text-amber-100/85"
          style={{ animationDelay: '360ms' }}
        >
          DEV Fake OTP mode: register or sign in with your mobile, then enter{' '}
          <strong>{DEV_FAKE_OTP_CODE}</strong>. No SMS. Production builds reject this.
        </p>
      ) : usingEmulators && !user ? (
        <p
          className="animate-fade-up relative mt-8 max-w-sm text-xs leading-relaxed text-[var(--ramkin-mist)]/40"
          style={{ animationDelay: '360ms' }}
        >
          Local emulators: Email/Password works without SMS. Optional phone OTP prints the code in
          the emulators terminal.
        </p>
      ) : null}
    </main>
  );
}
