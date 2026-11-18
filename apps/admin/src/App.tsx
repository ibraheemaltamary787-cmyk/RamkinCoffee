import { BRAND } from '@ramkin/shared';

export default function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <img
        src="/brand/ramkin-logo.jpg"
        alt={`${BRAND.name} logo`}
        className="animate-fade-up mb-6 h-20 w-20 rounded-full object-cover ring-1 ring-[var(--ramkin-gold)]/50"
      />
      <h1
        className="animate-fade-up text-4xl font-semibold tracking-[0.18em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)', animationDelay: '60ms' }}
      >
        {BRAND.name}
      </h1>
      <p
        className="animate-fade-up mt-3 text-xs font-medium tracking-[0.4em] uppercase text-[var(--ramkin-gold-soft)]/70"
        style={{ animationDelay: '120ms' }}
      >
        Staff &amp; Admin
      </p>
      <p
        className="animate-fade-up mt-6 max-w-md text-sm leading-relaxed text-[var(--ramkin-cream)]/65"
        style={{ animationDelay: '180ms' }}
      >
        Empty admin shell for Phase 2. Role-gated routes, purchase recording, and rewards queue land
        in Phases 3–5.
      </p>
    </main>
  );
}
