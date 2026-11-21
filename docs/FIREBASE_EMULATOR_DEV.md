# Firebase emulator & free phone-auth testing — RAMKIN Coffee

**Project:** `ramkincoffee` (never `hloe-45d43`)  
**Plan constraint:** Spark keep-free — **no Blaze**, **no production SMS**, **no Storage enablement**, **no production Hosting publish** without OWNER approval.  
**Cost context:** [`FIREBASE_COST_REPORT.md`](./FIREBASE_COST_REPORT.md)

Local Auth + Firestore + Functions emulators so loyalty callables stay server-side without deploying Cloud Functions.

---

## 1. Why emulators

| Need                                                                                                   | Production (Blaze)                            | Free path                                           |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------- |
| Privileged callables (purchase, reward approve/reject/redeem, combo reset, idempotency, activity logs) | Cloud Functions deploy                        | **Functions Emulator**                              |
| Customer phone OTP                                                                                     | Billed SMS (JO ≈ $0.24/SMS — see cost report) | **Auth Emulator** (and/or Console **test numbers**) |
| Staff Email/Password                                                                                   | Live Auth                                     | **Auth Emulator**                                   |
| Firestore under rules                                                                                  | Live Firestore                                | **Firestore Emulator**                              |

**Hard rule:** do **not** move privileged loyalty writes into the browser to avoid Blaze. Keep using callable Functions against the emulator.

Official docs:

- [Run functions locally](https://firebase.google.com/docs/functions/local-emulator)
- [Connect Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Phone auth — fictional test numbers](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers)

---

## 2. Ports (from `firebase.json`)

| Emulator                    | Host        | Port   |
| --------------------------- | ----------- | ------ |
| Auth                        | `127.0.0.1` | `9099` |
| Functions                   | `127.0.0.1` | `5001` |
| Firestore                   | `127.0.0.1` | `8080` |
| Emulator UI                 | `127.0.0.1` | `4000` |
| Hosting emulator (optional) | `127.0.0.1` | `5000` |

Apps connect when `VITE_USE_FIREBASE_EMULATORS=true`:

- `apps/customer/src/services/firebase.ts`
- `apps/admin/src/services/firebase.ts`

Both show an **EmulatorBanner** when the flag is on.

---

## 3. Install (one-time)

Requires **Node.js 22+** (Functions emulator rejects older `engines` ranges).

```bash
git clone https://github.com/ibraheemaltamary787-cmyk/RamkinCoffee.git
cd RamkinCoffee
npm install

cp .env.example apps/customer/.env
cp .env.example apps/admin/.env
```

In **each** app `.env`, set:

```bash
VITE_USE_FIREBASE_EMULATORS=true
```

Public `VITE_FIREBASE_*` values for `ramkincoffee` are already in `.env.example` (safe client IDs).

### Functions bootstrap secret (emulator only)

```bash
cp functions/.secret.local.example functions/.secret.local
# Edit if you want a different local secret (min 16 chars). File is gitignored (*.local).
```

`defineSecret('BOOTSTRAP_OWNER_SECRET')` reads `functions/.secret.local` in the Functions emulator. **Never** put this in Vite env or commit it.

---

## 4. Start the stack

**Terminal A — emulators** (builds Functions, then starts Auth + Functions + Firestore + UI):

```bash
npm run emulators
# equivalent:
# npm run build:functions && firebase emulators:start --only auth,functions,firestore
```

Emulator UI: http://127.0.0.1:4000

Optional Hosting emulator as well (static builds only — **not** production publish):

```bash
npm run emulators:all
```

**Terminal B — customer app**

```bash
npm run dev:customer   # http://localhost:5173
```

**Terminal C — admin app**

```bash
npm run dev:admin      # http://localhost:5174
```

Confirm each app shows the amber **Local Firebase emulators** banner.

---

## 5. Staff Email/Password + OWNER bootstrap (Functions emulator)

1. Emulator UI → **Authentication** → Add user → email + password (e.g. `owner@ramkin.local` / a long password).
2. Admin app → http://localhost:5174/login → sign in with that email/password.
3. Account has no staff role yet → **Go to bootstrap**.
4. Paste the secret from `functions/.secret.local` (`BOOTSTRAP_OWNER_SECRET=…`).
5. Callable `bootstrapOwner` runs on the **Functions emulator** → OWNER claim set.
6. Refresh / re-open `/app`.

Alternative without the Bootstrap page (Admin SDK → emulators):

```bash
# After creating the Auth user in Emulator UI, copy its uid:
npx tsx scripts/bootstrap-owner.local.ts --emulator --uid <AUTH_UID>
```

Then force a token refresh (sign out / sign in) in the admin app.

---

## 6. Customer phone OTP without SMS (Auth emulator)

1. Emulators must include **auth** (`npm run emulators`).
2. Customer app with `VITE_USE_FIREBASE_EMULATORS=true`.
3. Register / login with a fictional E.164 number (e.g. `+15550109999`).
4. The Auth emulator **does not send SMS** — it prints the verification code in the **emulators terminal** (also visible via Auth emulator REST — see [Auth emulator phone/SMS](https://firebase.google.com/docs/emulator-suite/connect_auth#emulated_phonesms_authentication)).
5. Enter that code in the app.

Notes:

- Emulator phone flow skips reCAPTCHA similarly to integration-test mode.
- Console **preconfigured test numbers are not used** by the Auth emulator.
- Emulator ID tokens work only with emulators / Admin SDK when `FIREBASE_AUTH_EMULATOR_HOST` is set.

### Optional: Console fictional test numbers (live Auth, still no SMS)

Use when intentionally hitting **live** Auth without carrier SMS ([docs](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers)):

1. Console → Authentication → Phone → **Phone numbers for testing** (≤10).
2. Apps with emulators **off**.
3. Sign in with the fictional number + fixed code.

Do **not** enable production SMS regions / real +962 traffic for keep-free.

---

## 7. Privileged callables via Functions emulator

With the stack up, exercise loyalty through the **apps** (callables → port `5001`), not client Firestore writes:

| Step                    | Where              | Callable / action                                        |
| ----------------------- | ------------------ | -------------------------------------------------------- |
| Ensure customer profile | Customer after OTP | `ensureCustomerProfile`                                  |
| Stamp                   | Admin Counter      | `recordPurchase` (replay same idempotency key → deduped) |
| Request reward          | Customer           | `requestReward`                                          |
| Approve / reject        | Admin Rewards      | `approveReward` / `rejectReward`                         |
| Redeem                  | Admin              | `redeemReward` (combo reset only here)                   |
| Logs / exports          | Admin              | `listActivityLogs` / `exportReport`                      |

Watch Functions logs in the emulators terminal and data in Emulator UI → Firestore. Full script: [`UAT_SCRIPT.md`](./UAT_SCRIPT.md).

---

## 8. Seed / demo loyalty data (emulators)

Admin SDK seed against Auth + Firestore emulators (no ADC, no Blaze):

```bash
# Plan only
npm run seed:emulator:dry
# or: npx tsx scripts/seed-loyalty-demo.local.ts --emulator --dry-run

# Write demo customer + N stamps + optional reward state
npm run seed:emulator -- --phone +15550109999 --n 3 --stop-at approved
npx tsx scripts/seed-loyalty-demo.local.ts --emulator --phone +15550109999 --n 2 --stop-at redeemed --name "Demo Guest"
```

| Flag         | Default        | Meaning                                                       |
| ------------ | -------------- | ------------------------------------------------------------- |
| `--emulator` | off            | Use `FIREBASE_AUTH_EMULATOR_HOST` + `FIRESTORE_EMULATOR_HOST` |
| `--dry-run`  | off            | Print plan only                                               |
| `--phone`    | `+15550109999` | E.164 demo customer                                           |
| `--n`        | `3`            | Stamps / `requiredPurchases` for this combo                   |
| `--stop-at`  | `approved`     | `purchases` \| `requested` \| `approved` \| `redeemed`        |
| `--name`     | `Demo Guest`   | Display name                                                  |

Emulators must be running before a non-dry-run seed. See [`scripts/seed-loyalty-demo.outline.md`](../scripts/seed-loyalty-demo.outline.md).

---

## 9. What not to do

- Upgrade to **Blaze** or add a payment method.
- Enable production Phone SMS / open SMS regions for real carriers.
- Enable **Cloud Storage**.
- Run `firebase deploy --only hosting` (or Functions) without OWNER go-live / Blaze approval.
- Put privileged purchase/reward mutations in client Firestore writes.
- Reuse project **`hloe-45d43`** or commit secrets / service-account JSON.

---

## 10. Quick checklist

- [ ] `npm install`
- [ ] `apps/customer/.env` + `apps/admin/.env` from `.env.example` with `VITE_USE_FIREBASE_EMULATORS=true`
- [ ] `cp functions/.secret.local.example functions/.secret.local`
- [ ] `npm run emulators`
- [ ] `npm run dev:customer` + `npm run dev:admin` (amber emulator banner)
- [ ] Staff Email/Password via Emulator UI → bootstrap OWNER via Functions emulator
- [ ] Customer phone OTP code from emulators terminal
- [ ] Privileged actions only via Functions emulator callables
- [ ] Optional: `npm run seed:emulator -- --n 3 --stop-at approved`
- [ ] No Blaze / billing / real SMS / Hosting publish
