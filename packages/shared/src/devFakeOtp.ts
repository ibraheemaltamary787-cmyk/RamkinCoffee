/**
 * Development-only Fake OTP helpers.
 *
 * OTP code `0000` is for local / emulator testing. Production builds and
 * non-emulator Cloud Functions MUST reject this path.
 */
import { z } from 'zod';
import { normalizePhone } from './loyalty';

/** Fixed DEV OTP — never accept in production. */
export const DEV_FAKE_OTP_CODE = '0000';

/** Local-only staff/customer login identifiers (not real email delivery). */
export const DEV_LOCAL_EMAIL_SUFFIX = '@ramkin.local';

const E164_RE = /^\+[1-9]\d{7,14}$/;

export function isE164Phone(value: string): boolean {
  return E164_RE.test(value);
}

/** Normalize raw phone input to E.164 when possible; otherwise return digits-only. */
export function toE164Phone(raw: string): string {
  const normalized = normalizePhone(raw);
  if (normalized.startsWith('+')) return normalized;
  if (normalized.startsWith('00')) return `+${normalized.slice(2)}`;
  // Local Jordan-style leading 0 → leave for caller validation (must include country code).
  return normalized.startsWith('+') ? normalized : `+${normalized.replace(/^\+/, '')}`;
}

export function isDevLocalIdentifier(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.endsWith(DEV_LOCAL_EMAIL_SUFFIX) && trimmed.includes('@');
}

/**
 * Client-side gate: Fake OTP UI/API only when explicitly enabled AND not a
 * production Vite build. Even if `VITE_DEV_FAKE_OTP=true` leaks into a prod
 * build, `import.meta.env.PROD` blocks it.
 */
export function isClientDevFakeOtpEnabled(env: {
  PROD?: boolean;
  VITE_DEV_FAKE_OTP?: string;
}): boolean {
  if (env.PROD === true) return false;
  return env.VITE_DEV_FAKE_OTP === 'true';
}

/**
 * Server-side gate for the `devFakeOtpSignIn` callable.
 * Allowed only on Functions emulator, or when ALLOW_DEV_FAKE_OTP=true
 * (never set that in production).
 */
export function isServerDevFakeOtpAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ALLOW_DEV_FAKE_OTP === 'true') return true;
  if (env.FUNCTIONS_EMULATOR === 'true') return true;
  return false;
}

export function assertValidDevOtp(otp: string): void {
  if (otp.trim() !== DEV_FAKE_OTP_CODE) {
    throw new Error('Invalid OTP. Development Fake OTP is 0000.');
  }
}

/**
 * Callable JSON often sends `null` for omitted optionals; treat `""` / whitespace
 * as absent so Zod does not throw (which Firebase surfaces as INTERNAL).
 */
export const optionalDisplayNameSchema = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}, z.string().trim().min(1).max(80).optional());

export const devFakeOtpSignInSchema = z.object({
  mode: z.enum(['register', 'login']),
  /** E.164 phone, or a `@ramkin.local` identifier (login only for staff seeds). */
  identifier: z.string().trim().min(3).max(80),
  otp: z.string().trim().min(4).max(8),
  displayName: optionalDisplayNameSchema,
});

export type DevFakeOtpSignInInput = z.infer<typeof devFakeOtpSignInSchema>;

export interface DevFakeOtpSignInResult {
  ok: true;
  customToken: string;
  uid: string;
  phone: string | null;
  email: string | null;
  isNewUser: boolean;
  mode: 'register' | 'login';
  /** Always true — clients should show DEV banners. */
  devFakeOtp: true;
}

/** Map Firebase callable / Auth errors to actionable local-dev copy. */
export function formatFirebaseCallableError(err: unknown, fallback: string): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  const message =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message.trim()
      : err instanceof Error
        ? err.message.trim()
        : '';

  if (
    code === 'functions/not-found' ||
    /^not-found$/i.test(message)
  ) {
    return 'Functions emulator not reachable. Run `npm run emulators`, keep VITE_USE_FIREBASE_EMULATORS=true, then restart Vite.';
  }
  if (code === 'functions/unavailable' || /unavailable/i.test(message)) {
    return 'Functions emulator unavailable. Wait until Terminal A shows “All emulators ready!” and retry.';
  }
  if (code === 'functions/internal' || /^internal$/i.test(message)) {
    // Prefer a specific server message when Functions returned one via HttpsError.
    if (message && !/^internal$/i.test(message)) return message;
    return 'Internal Functions error. Check the emulators terminal log. Confirm Auth+Functions+Firestore are up, apps/*.env has VITE_USE_FIREBASE_EMULATORS=true and VITE_DEV_FAKE_OTP=true, then re-run `npm run seed:dev-accounts`.';
  }
  if (message) return message;
  return fallback;
}
