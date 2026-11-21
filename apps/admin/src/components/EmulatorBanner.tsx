import { isUsingFirebaseEmulators } from '../services/firebase';

/** Visible reminder that privileged callables hit local emulators — never production. */
export function EmulatorBanner() {
  if (!isUsingFirebaseEmulators()) return null;

  return (
    <div className="border-b border-[var(--ramkin-gold)]/35 bg-black/70 px-4 py-2 text-center text-xs tracking-wide text-[var(--ramkin-gold-soft)]/90">
      Local Firebase emulators — Auth <code className="text-[var(--ramkin-gold)]">9099</code> ·
      Functions <code className="text-[var(--ramkin-gold)]">5001</code> · Firestore{' '}
      <code className="text-[var(--ramkin-gold)]">8080</code>. Staff Email/Password → bootstrap · no
      production Hosting / SMS / Blaze.
    </div>
  );
}
