import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RequireSignedIn({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth();

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

  return <>{children}</>;
}
