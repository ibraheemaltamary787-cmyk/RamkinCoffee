/**
 * Shared Admin SDK init for local scripts.
 * Prefer --emulator (Auth + Firestore emulators) on Spark keep-free.
 * Staging ADC path never targets hloe-45d43.
 */
import { applicationDefault, initializeApp, getApps, type App } from 'firebase-admin/app';

export const EMULATOR_AUTH_HOST = '127.0.0.1:9099';
export const EMULATOR_FIRESTORE_HOST = '127.0.0.1:8080';
export const RAMKIN_PROJECT_ID = 'ramkincoffee';

export function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

export function argValue(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

export function assertNotHloe(projectId: string): void {
  if (projectId === 'hloe-45d43') {
    throw new Error('Refusing to use hloe-45d43 — RAMKIN only (ramkincoffee / emulators).');
  }
}

/**
 * Initialize Admin SDK once.
 * --emulator sets FIREBASE_AUTH_EMULATOR_HOST + FIRESTORE_EMULATOR_HOST (no ADC).
 */
export function initAdminApp(opts: { emulator: boolean; projectId?: string }): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId =
    opts.projectId ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    RAMKIN_PROJECT_ID;

  assertNotHloe(projectId);

  if (opts.emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= EMULATOR_AUTH_HOST;
    process.env.FIRESTORE_EMULATOR_HOST ||= EMULATOR_FIRESTORE_HOST;
    process.env.GCLOUD_PROJECT ||= projectId;
    return initializeApp({ projectId });
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export function resolveProjectId(): string {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    RAMKIN_PROJECT_ID
  );
}
