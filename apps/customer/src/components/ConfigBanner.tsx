import { isFirebaseConfigured } from '../services/firebase';

export function ConfigBanner() {
  if (isFirebaseConfigured()) return null;

  return (
    <div className="border-b border-[var(--ramkin-gold)]/30 bg-black/60 px-4 py-3 text-center text-sm text-[var(--ramkin-gold-soft)]">
      Firebase placeholders only — copy <code className="text-[var(--ramkin-gold)]">.env.example</code> to{' '}
      <code className="text-[var(--ramkin-gold)]">apps/customer/.env</code> and fill{' '}
      <code className="text-[var(--ramkin-gold)]">VITE_FIREBASE_*</code> from a new RAMKIN project. Phone OTP
      also needs Auth → Phone enabled (or Emulator). Never use <code>hloe-45d43</code>.
    </div>
  );
}
