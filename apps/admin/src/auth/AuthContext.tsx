import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { isStaffRole, type Role, type StaffRole } from '@ramkin/shared';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';
import { callDevFakeOtpSignIn, callRecordLogin } from '../services/callables';
import { isDevFakeOtpEnabled } from '../services/devFakeOtp';

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  role: Role | null;
  isStaff: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<Role | null>;
  /** DEV ONLY — identifier (@ramkin.local or phone) + Fake OTP 0000. */
  signInWithFakeOtp: (identifier: string, otp: string) => Promise<Role | null>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (next) => {
      setLoading(true);
      setError(null);
      try {
        if (!next) {
          setUser(null);
          setRole(null);
          return;
        }
        setUser(next);
        setRole(await readRole(next));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        throw new Error('Firebase not configured');
      }
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      const nextRole = await readRole(cred.user);
      setUser(cred.user);
      setRole(nextRole);
      if (isStaffRole(nextRole)) {
        try {
          await callRecordLogin();
        } catch {
          // Best-effort until Functions are live.
        }
      }
      return nextRole;
    },
    [configured],
  );

  const signInWithFakeOtp = useCallback(
    async (identifier: string, otp: string) => {
      if (!configured) {
        throw new Error('Firebase not configured');
      }
      if (!isDevFakeOtpEnabled()) {
        throw new Error('Development Fake OTP is disabled in this build.');
      }
      const result = await callDevFakeOtpSignIn({
        mode: 'login',
        identifier: identifier.trim(),
        otp: otp.trim(),
      });
      const cred = await signInWithCustomToken(getFirebaseAuth(), result.customToken);
      await cred.user.getIdToken(true);
      const nextRole = await readRole(cred.user);
      setUser(cred.user);
      setRole(nextRole);
      if (isStaffRole(nextRole)) {
        try {
          await callRecordLogin();
        } catch {
          // Best-effort until Functions are live.
        }
      }
      return nextRole;
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await firebaseSignOut(getFirebaseAuth());
  }, [configured]);

  const refreshClaims = useCallback(async () => {
    if (!user) return;
    await user.getIdToken(true);
    setRole(await readRole(user));
  }, [user]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      role,
      isStaff: isStaffRole(role),
      error,
      signIn,
      signInWithFakeOtp,
      signOut,
      refreshClaims,
    }),
    [configured, loading, user, role, error, signIn, signInWithFakeOtp, signOut, refreshClaims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useStaffRole(): StaffRole | null {
  const { role } = useAuth();
  return isStaffRole(role) ? role : null;
}
