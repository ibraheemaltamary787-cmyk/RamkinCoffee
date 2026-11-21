import { isUsingFirebaseEmulators } from '../services/firebase';

/** Visible reminder that privileged callables hit local emulators — never production. */
export function EmulatorBanner() {
  if (!isUsingFirebaseEmulators()) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/50 px-4 py-2 text-center text-xs tracking-wide text-amber-100/90">
      Local Firebase emulators — Auth <code className="text-amber-200">9099</code> · Functions{' '}
      <code className="text-amber-200">5001</code> · Firestore{' '}
      <code className="text-amber-200">8080</code>. No production Hosting / SMS / Blaze.
    </div>
  );
}
