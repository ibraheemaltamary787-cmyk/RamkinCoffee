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

export const devFakeOtpSignInSchema = z.object({
  mode: z.enum(['register', 'login']),
  /** E.164 phone, or a `@ramkin.local` identifier (login only for staff seeds). */
  identifier: z.string().trim().min(3).max(80),
  otp: z.string().trim().min(4).max(8),
  // Callables may serialize omitted fields as null — accept nullish.
  displayName: z.string().trim().min(1).max(80).nullish(),
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
