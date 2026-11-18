import { Link, Navigate } from 'react-router-dom';
import { BRAND, DEFAULT_PURCHASES_REQUIRED } from '@ramkin/shared';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { loading, user, displayName, signOut, configured } = useAuth();

  if (!configured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 text-center">
        <p className="text-[var(--ramkin-gold-soft)]">
          Configure Firebase env vars before using the dashboard.
        </p>
        <Link to="/" className="mt-4 text-[var(--ramkin-gold)] underline">
          Home
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-[var(--ramkin-gold-soft)]">
        Loading…
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-10">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p
              className="text-xl tracking-[0.15em] text-[var(--ramkin-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {BRAND.name}
            </p>
            <p className="text-xs text-[var(--ramkin-cream)]/55">Loyalty dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-xs tracking-[0.2em] text-[var(--ramkin-gold-soft)]/80 uppercase hover:text-[var(--ramkin-gold)]"
        >
          Sign out
        </button>
      </header>

      <section className="animate-fade-up border border-[var(--ramkin-gold)]/20 bg-black/30 p-6">
        <p className="text-sm text-[var(--ramkin-cream)]/60">Welcome</p>
        <h1 className="mt-1 text-2xl text-[var(--ramkin-cream)]" style={{ fontFamily: 'var(--font-display)' }}>
          {displayName || user.phoneNumber || 'Guest'}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ramkin-cream)]/65">
          Stamp progress arrives in Phase 4. For now this shell confirms your phone account is signed
          in. Default card: buy {DEFAULT_PURCHASES_REQUIRED}, get the next free.
        </p>
        <div className="mt-6 h-2 w-full overflow-hidden bg-white/5">
          <div className="h-full w-0 bg-[var(--ramkin-gold)] transition-all" />
        </div>
        <p className="mt-2 text-xs tracking-[0.15em] text-[var(--ramkin-gold-soft)]/70 uppercase">
          0 / {DEFAULT_PURCHASES_REQUIRED} stamps
        </p>
      </section>

      <nav className="mt-8 flex gap-4 text-sm">
        <Link to="/profile" className="text-[var(--ramkin-gold)] hover:underline">
          Profile
        </Link>
        <Link to="/" className="text-[var(--ramkin-cream)]/50 hover:text-[var(--ramkin-gold)]">
          Home
        </Link>
      </nav>
    </main>
  );
}
