/**
 * App Check hooks — documented stubs until Console enrollment is complete.
 *
 * OWNER / Ibraheem must:
 * 1. Firebase Console → App Check → register customer + admin web apps
 * 2. Choose reCAPTCHA v3 (or Enterprise) provider; add site keys to Console only
 * 3. Enforce App Check on Cloud Functions + Firestore (gradual rollout)
 * 4. Client: initialize App Check with `ReCaptchaV3Provider` using a *public* site key
 *    via `VITE_FIREBASE_APPCHECK_SITE_KEY` (never a secret)
 *
 * Until then, callables rely on Auth + RBAC + rate limits. Set
 * `ENFORCE_APP_CHECK=true` on Functions after Console enforcement is live.
 */

import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';

export const APP_CHECK_SETUP_NOTES = [
  'Register RAMKIN web apps in Firebase Console → App Check (never hloe-45d43).',
  'Use reCAPTCHA v3 site key in Vite env as VITE_FIREBASE_APPCHECK_SITE_KEY (public).',
  'Do not commit App Check debug tokens for production.',
  'After Console enforcement, set Functions env ENFORCE_APP_CHECK=true.',
] as const;

/**
 * Soft check: when ENFORCE_APP_CHECK=true, require a verified App Check token.
 * When unset/false, log that enforcement is disabled (no throw).
 */
export function assertAppCheck(request: CallableRequest, contextLabel: string): void {
  const enforce = process.env.ENFORCE_APP_CHECK === 'true';
  const hasToken = Boolean(request.app);

  if (enforce && !hasToken) {
    throw new HttpsError(
      'failed-precondition',
      `App Check required for ${contextLabel}. Complete Console setup, then retry.`,
    );
  }

  // Soft path: allow through; callers can inspect request.app when present.
  void hasToken;
}

/** Callable options helpers for gradual App Check enforcement. */
export function appCheckCallableOptions(): { enforceAppCheck: boolean } {
  return { enforceAppCheck: process.env.ENFORCE_APP_CHECK === 'true' };
}
