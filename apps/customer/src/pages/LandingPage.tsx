import { Link } from 'react-router-dom';
import { BRAND } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,169,98,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="animate-fade-up relative mb-8">
        <BrandMark size="lg" />
      </div>

      <h1
        className="animate-fade-up relative text-5xl font-semibold tracking-[0.2em] text-[var(--ramkin-gold)] sm:text-6xl"
        style={{ fontFamily: 'var(--font-display)', animationDelay: '80ms' }}
      >
        {BRAND.name}
      </h1>

      <p
        className="animate-fade-up animate-gold-sheen relative mt-4 max-w-md text-sm font-light tracking-[0.35em] uppercase text-[var(--ramkin-gold-soft)]/80"
        style={{ animationDelay: '160ms' }}
      >
        {BRAND.tagline}
      </p>

      <p
        className="animate-fade-up relative mt-8 max-w-lg text-base leading-relaxed text-[var(--ramkin-cream)]/70"
        style={{ animationDelay: '240ms' }}
      >
        Join the RAMKIN loyalty circle. Sign in with your phone to track stamps toward your next
        free drink.
      </p>

      <div
        className="animate-fade-up relative mt-10 flex flex-wrap items-center justify-center gap-4"
        style={{ animationDelay: '320ms' }}
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
              className="border border-[var(--ramkin-gold)]/50 px-8 py-3 text-sm font-medium tracking-[0.2em] text-[var(--ramkin-gold)] uppercase transition hover:border-[var(--ramkin-gold)] hover:bg-white/5"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
