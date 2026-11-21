# Firebase emulator & free phone-auth testing — RAMKIN Coffee

**Project:** `ramkincoffee` (never `hloe-45d43`)  
**Plan constraint:** Spark keep-free — **no Blaze**, **no production SMS**, **no Storage enablement** without OWNER approval.  
**Cost context:** [`FIREBASE_COST_REPORT.md`](./FIREBASE_COST_REPORT.md)

This guide is documentation-only: local emulators and (optional) Console **test** phone numbers. It does not deploy Functions or send carrier SMS.

---

## 1. Why emulators

| Need | Production (Blaze) | Free path |
|------|--------------------|-----------|
| Privileged callables (purchase, reward approve/reject/redeem, combo reset, idempotency, activity logs) | Cloud Functions deploy | **Functions Emulator** |
| Customer phone OTP | Billed SMS (JO ≈ $0.24/SMS after free daily allowance — see cost report) | **Auth Emulator** and/or Console **test numbers** |
| Firestore reads/writes under rules | Live Firestore | **Firestore Emulator** |

**Hard rule:** do **not** move privileged loyalty writes into the browser to avoid Blaze. Keep using callable Functions against the emulator.

Official docs:

- [Run functions locally](https://firebase.google.com/docs/functions/local-emulator)  
- [Connect Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)  
- [Phone auth — fictional test numbers](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers)

---

## 2. Ports (from `firebase.json`)

| Emulator | Host | Port |
|----------|------|------|
| Auth | `127.0.0.1` | `9099` |
| Functions | `127.0.0.1` | `5001` |
| Firestore | `127.0.0.1` | `8080` |
| Emulator UI | local | `4000` |
| Hosting emulator (optional) | local | `5000` |

Apps already call `connectAuthEmulator` / `connectFirestoreEmulator` / `connectFunctionsEmulator` when `VITE_USE_FIREBASE_EMULATORS=true` (`apps/customer` and `apps/admin` `src/services/firebase.ts`).

---

## 3. One-time local setup

```bash
# From repo root
npm install
cp .env.example apps/customer/.env
cp .env.example apps/admin/.env
# Public web config is already filled for ramkincoffee in .env.example.
# In each app .env, enable emulators:
#   VITE_USE_FIREBASE_EMULATORS=true
```

Build Functions TypeScript at least once so the emulator can load compiled output:

```bash
npm run build -w @ramkin/functions
# or: npm run build
```

---

## 4. Start emulators + apps

```bash
firebase use ramkincoffee   # or --project ramkincoffee
firebase emulators:start --only auth,functions,firestore
```

In other terminals:

```bash
npm run dev:customer   # http://localhost:5173
npm run dev:admin      # http://localhost:5174
```

Open Emulator UI at http://127.0.0.1:4000 — Auth users, Firestore data, and Functions logs.

---

## 5. Phone sign-in without carrier SMS

### A. Auth Emulator (preferred on Spark)

1. Start emulators with **auth** included (above).  
2. App uses `VITE_USE_FIREBASE_EMULATORS=true` → SDK talks to port `9099`.  
3. Trigger the normal phone sign-in UI.  
4. The emulator **does not send SMS**; it prints the verification code in the terminal where `firebase emulators:start` is running (also retrievable via the Auth emulator REST API — see [Auth emulator — phone/SMS](https://firebase.google.com/docs/emulator-suite/connect_auth#emulated_phonesms_authentication)).  
5. Enter that code in the app.

Notes from official docs:

- Emulator phone flow skips reCAPTCHA similarly to integration-test mode.  
- Console **preconfigured test numbers are not used** by the Auth emulator — codes are generated per attempt.  
- Emulator ID tokens are for emulators/Admin SDK with `FIREBASE_AUTH_EMULATOR_HOST` only — not production APIs.

### B. Console fictional test phone numbers (optional)

Use when exercising the **live** Auth backend **without** sending SMS ([Firebase docs](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers)):

1. Firebase Console → Authentication → Sign-in method → enable **Phone** if required for the test-numbers UI.  
2. Expand **Phone numbers for testing**.  
3. Add a **fictional** number (e.g. `+1 650-555-3434`) and a fixed 6-digit code (e.g. `654321`). Max **10** numbers.  
4. In the app (emulators **off**), sign in with that number + code — **no SMS is sent**.

**Keep-free cautions:**

- Do **not** enable production SMS region delivery / real +962 traffic.  
- Do **not** upgrade to Blaze for “just testing” SMS.  
- Recycle test numbers; do not hardcode them in production builds.  
- Prefer the **Auth Emulator** while the project stays on Spark and Phone production remains disabled.

### Template (documentation only — invent your own fictional numbers)

```text
# Console → Authentication → Phone numbers for testing
# Example shape only — do not use real subscriber numbers.
+1 650-555-0100 → 123456
+1 650-555-0101 → 123456
```

---

## 6. Staff Email/Password on emulators

1. Emulator UI → Authentication → Add user → email/password.  
2. Sign in on the admin app.  
3. For OWNER bootstrap against emulators, use the same callable/bootstrap flow pointed at the Functions emulator (never commit `BOOTSTRAP_OWNER_SECRET`).

---

## 7. Privileged flows to exercise locally

With Auth + Functions + Firestore emulators up, walk the loyalty path (see `docs/UAT_SCRIPT.md`):

1. `ensureCustomerProfile` / register  
2. `recordPurchase` (idempotency key; replay → deduped)  
3. `requestReward` → `approveReward` / `rejectReward`  
4. `redeemReward` (combo reset only here)  
5. `listActivityLogs` / exports as applicable  

Confirm Firestore emulator data and Functions logs — **not** production Console data.

---

## 8. What not to do

- Upgrade to **Blaze** or add a payment method.  
- Enable production Phone SMS / open SMS regions for real carriers.  
- Enable **Cloud Storage** (Spark Console blocks; needs Blaze).  
- Publish production Hosting without OWNER go-live approval.  
- Put privileged purchase/reward mutations in client Firestore writes.  
- Reuse project **`hloe-45d43`** or invent private secrets into the repo.

---

## 9. Quick checklist

- [ ] `.env` has public `ramkincoffee` web config from `.env.example`  
- [ ] `VITE_USE_FIREBASE_EMULATORS=true` in customer + admin `.env`  
- [ ] `firebase emulators:start --only auth,functions,firestore`  
- [ ] Phone codes read from emulator terminal (or Console test numbers if intentionally using live Auth test config)  
- [ ] Privileged actions only via Functions emulator callables  
- [ ] No Blaze / billing / real SMS steps
