import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import type { Role } from '@ramkin/shared';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';
import { callEnsureCustomerProfile, callRecordLogin } from '../services/callables';

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  role: Role | null;
  displayName: string | null;
  error: string | null;
  refreshClaims: () => Promise<void>;
  signOut: () => Promise<void>;
  ensureProfile: (displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function readRole(user: User): Promise<Role | null> {
  const token = await user.getIdTokenResult();
  const role = token.claims.role;
  if (role === 'OWNER' || role === 'MANAGER' || role === 'STAFF' || role === 'CUSTOMER') {
    return role;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (next) => {
      setLoading(true);
      setError(null);
      try {
        if (!next) {
          setUser(null);
          setRole(null);
          setDisplayName(null);
          return;
        }
        setUser(next);
        setDisplayName(next.displayName);
        setRole(await readRole(next));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth state error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [configured]);

  const refreshClaims = useCallback(async () => {
    if (!user) return;
    await user.getIdToken(true);
    setRole(await readRole(user));
  }, [user]);

  const ensureProfile = useCallback(async (name?: string) => {
    const current = getFirebaseAuth().currentUser;
    if (!current) throw new Error('Not signed in');
    const result = await callEnsureCustomerProfile(name ? { displayName: name } : {});
    setDisplayName(result.profile.displayName);
    if (result.claimsRefreshRequired) {
      await current.getIdToken(true);
      setRole(await readRole(current));
    } else {
      setRole('CUSTOMER');
    }
    try {
      await callRecordLogin();
    } catch {
      // Login audit is best-effort until Functions emulator / deploy is available.
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await firebaseSignOut(getFirebaseAuth());
  }, [configured]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      role,
      displayName,
      error,
      refreshClaims,
      signOut,
      ensureProfile,
    }),
    [configured, loading, user, role, displayName, error, refreshClaims, signOut, ensureProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
