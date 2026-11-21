# OWNER bootstrap (Phase 3)

Custom claims are set **only** via Admin SDK (Cloud Functions). Clients never send `role`.

## Prerequisites

1. Create a **new** RAMKIN Firebase project (never `hloe-45d43`).
2. Enable Email/Password Auth.
3. Create the owner Auth user (Console → Authentication → Add user) with Ibraheem’s email.
4. Deploy Functions from this repo.
5. Set the Functions secret (do **not** commit the value):

   ```bash
   firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET
   # enter a long random string (≥16 chars), then redeploy bootstrapOwner
   ```

## Callable flow (recommended)

1. Sign in to the **admin** app as the owner email/password user.
2. Open browser console (or a temporary admin UI form) and call:

   ```ts
   import { getFunctions, httpsCallable } from 'firebase/functions';
   const bootstrapOwner = httpsCallable(getFunctions(), 'bootstrapOwner');
   await bootstrapOwner({ secret: '<same secret as BOOTSTRAP_OWNER_SECRET>' });
   ```

3. Force token refresh: `await auth.currentUser.getIdToken(true)`.
4. Confirm custom claim `{ role: "OWNER" }` and `users/{uid}` doc.
5. **Rotate or delete** `BOOTSTRAP_OWNER_SECRET` so the path cannot be reused.
   Subsequent staff grants use `setStaffRole` (OWNER-only).

## Guardrails (implemented)

- Rejects if any `users` doc with `role == OWNER` already exists.
- Requires authenticated caller with email.
- Requires matching `BOOTSTRAP_OWNER_SECRET`.
- Writes `activityLogs` action `role.bootstrap_owner`.
- Never accepts `role` from the client body.

## Local / emulator alternatives

### Spark keep-free (Functions emulator + `.secret.local`)

Preferred while staying off Blaze — see [`docs/FIREBASE_EMULATOR_DEV.md`](../docs/FIREBASE_EMULATOR_DEV.md):

1. `cp functions/.secret.local.example functions/.secret.local`
2. `npm run emulators` + admin app with `VITE_USE_FIREBASE_EMULATORS=true`
3. Create email/password user in Emulator UI → sign in → `/bootstrap` with the local secret

Or Admin SDK against emulators (no ADC):

```bash
npx tsx scripts/bootstrap-owner.local.ts --emulator --uid <OWNER_UID>
```

### Staging ADC

With Application Default Credentials / a **local** service-account JSON that is **gitignored** (ramkincoffee only):

```bash
# Example only — do not commit keys
GOOGLE_APPLICATION_CREDENTIALS=./secrets/ramkin-sa.json \
  npx tsx scripts/bootstrap-owner.local.ts --uid <OWNER_UID>
```

Prefer the callable in staging/production so the secret gate and “one OWNER” check stay centralized.
