import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { BRAND } from '@ramkin/shared';

initializeApp();

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/**
 * Phase 2 smoke callable — proves Functions deploy wiring.
 * Privileged loyalty callables land in Phase 3–4.
 */
export const helloRamkin = onCall({ cors: true }, () => {
  return {
    ok: true as const,
    brand: BRAND.name,
    message: 'RAMKIN Cloud Functions foundation is live.',
    phase: 2,
  };
});

/**
 * Stub for Phase 3 OWNER bootstrap — intentionally unimplemented.
 * See README → "Bootstrap first OWNER".
 */
export const bootstrapOwner = onCall({ cors: true }, () => {
  throw new HttpsError(
    'failed-precondition',
    'OWNER bootstrap is not enabled yet. Follow README Phase 3 steps.',
  );
});
