import { useAuth } from '../auth/AuthContext';

export function OverviewPage() {
  const { role } = useAuth();

  return (
    <section>
      <h1
        className="text-3xl tracking-[0.1em] text-[var(--ramkin-gold)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Operations shell
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ramkin-cream)]/65">
        Phase 3 role-gated admin shell. Purchase recording, rewards queue, and reports arrive in later
        phases. Routes are hidden by role for UX only — Cloud Functions enforce every privileged action.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-black/30 p-4">
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Your role</dt>
          <dd className="mt-2 text-lg text-[var(--ramkin-gold)]">{role}</dd>
        </div>
        <div className="border border-white/10 bg-black/30 p-4">
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Purchases</dt>
          <dd className="mt-2 text-sm text-[var(--ramkin-cream)]/55">Phase 4</dd>
        </div>
        <div className="border border-white/10 bg-black/30 p-4">
          <dt className="text-xs tracking-[0.2em] text-[var(--ramkin-cream)]/45 uppercase">Rewards</dt>
          <dd className="mt-2 text-sm text-[var(--ramkin-cream)]/55">Phase 4–5</dd>
        </div>
      </dl>
    </section>
  );
}
