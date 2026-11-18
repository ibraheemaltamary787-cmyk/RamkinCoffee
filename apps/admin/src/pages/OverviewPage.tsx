import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function OverviewPage() {
  const { role } = useAuth();

  return (
    <section>
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Operations
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ramkin-cream)]/65">
        Phase 4 loyalty engine is live in code: staff stamp purchases, customers request rewards,
        and combos reset only after redeem. Stats polish arrives in Phase 5.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-black/30 p-4">
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Your role</dt>
          <dd className="mt-2 text-lg text-[var(--ramkin-gold)]">{role}</dd>
        </div>
        <Link
          to="/app/counter"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Purchases</dt>
          <dd className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Open counter →</dd>
        </Link>
        <Link
          to="/app/rewards"
          className="border border-white/10 bg-black/30 p-4 transition hover:border-[var(--ramkin-gold)]/40"
        >
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Rewards</dt>
          <dd className="mt-2 text-sm text-[var(--ramkin-gold-soft)]">Open queue →</dd>
        </Link>
      </dl>
    </section>
  );
}
