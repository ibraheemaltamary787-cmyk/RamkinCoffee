/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  /** Public reCAPTCHA v3 site key after App Check Console enrollment. */
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  /** DEV ONLY — Fake OTP 0000. Must stay unset/false in production builds. */
  readonly VITE_DEV_FAKE_OTP?: string;
  /** Optional absolute landing URL for QR stickers (future prod domain). */
  readonly VITE_QR_LANDING_URL?: string;
  /** Official Foodics online menu URL for Order Online. */
  readonly VITE_FOODICS_MENU_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
