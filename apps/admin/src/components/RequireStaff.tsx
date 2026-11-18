import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '@ramkin/shared';

interface RequireStaffProps {
  children: React.ReactNode;
  /** Optional minimum roles; defaults to any staff role. */
  roles?: Role[];
}

export function RequireStaff({ children, roles }: RequireStaffProps) {
  const { configured, loading, user, role, isStaff } = useAuth();

  if (!configured) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--ramkin-gold-soft)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-xl text-[var(--ramkin-gold)]">Staff access required</h1>
        <p className="mt-3 text-sm text-[var(--ramkin-cream)]/65">
          This account has no staff role claim. Complete OWNER bootstrap or ask an OWNER to run{' '}
          <code>setStaffRole</code>. UI gates are UX only — Functions remain authoritative.
        </p>
      </main>
    );
  }

  if (roles && role && !roles.includes(role)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-xl text-[var(--ramkin-gold)]">Insufficient role</h1>
        <p className="mt-3 text-sm text-[var(--ramkin-cream)]/65">
          Your role ({role}) cannot open this screen. Server callables will also deny the action.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
