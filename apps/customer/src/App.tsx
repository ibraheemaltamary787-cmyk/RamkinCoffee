import { BRAND } from '@ramkin/shared';

export default function App() {
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

      <img
        src="/brand/ramkin-logo.jpg"
        alt={`${BRAND.name} logo`}
        className="animate-fade-up relative mb-8 h-28 w-28 rounded-full object-cover shadow-[0_0_40px_rgba(201,169,98,0.25)] ring-1 ring-[var(--ramkin-gold)]/40 sm:h-36 sm:w-36"
      />

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
        Digital loyalty for RAMKIN Coffee — Phase 2 foundation shell. Auth, stamps, and rewards
        arrive in later phases.
      </p>
    </main>
  );
}
