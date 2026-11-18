import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

/** Public reCAPTCHA v3 site key — set after Console App Check enrollment. */
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY ?? '';

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId && config.authDomain);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let appCheck: AppCheck | null = null;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to apps/customer/.env and fill VITE_FIREBASE_* from a new RAMKIN project (never hloe-45d43).',
    );
  }
  if (!app) {
    app = initializeApp(config);
    maybeInitAppCheck(app);
  }
  return app;
}

/**
 * App Check stub: initializes only when `VITE_FIREBASE_APPCHECK_SITE_KEY` is set.
 * Console enrollment + Functions `ENFORCE_APP_CHECK=true` are still required for enforcement.
 */
function maybeInitAppCheck(firebaseApp: FirebaseApp): void {
  if (appCheck || !appCheckSiteKey) return;
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') return;
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    maybeConnectEmulators();
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    maybeConnectEmulators();
  }
  return db;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), 'us-central1');
    maybeConnectEmulators();
  }
  return functions;
}

function maybeConnectEmulators(): void {
  if (emulatorsConnected) return;
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true') return;
  const authInstance = auth ?? getAuth(getFirebaseApp());
  const dbInstance = db ?? getFirestore(getFirebaseApp());
  const fnInstance = functions ?? getFunctions(getFirebaseApp(), 'us-central1');
  connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
  connectFunctionsEmulator(fnInstance, '127.0.0.1', 5001);
  emulatorsConnected = true;
}
