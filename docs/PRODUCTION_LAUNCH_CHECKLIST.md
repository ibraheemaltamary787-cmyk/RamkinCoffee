# Production launch checklist — RAMKIN Coffee

**Status:** Docs ready. Firebase project **`ramkincoffee`** (number `392513147835`) is linked in `.firebaserc`. **Live deploy is blocked** until web `apiKey`/`appId` are provided, Auth/Hosting are configured, and an authenticated CLI runs deploy.  
**Never** create, link, or reuse `hloe-45d43`. Do not invent API keys, app IDs, or other secrets in the repo.

This checklist is the ordered go-live path. Tick each step in Firebase Console / CLI as you complete it. Companion docs: [OWNER_HANDOVER.md](./OWNER_HANDOVER.md) · [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) · [MONITORING_ALERTS.md](./MONITORING_ALERTS.md) · [PHASE7_LIVE_BLOCKERS.md](./PHASE7_LIVE_BLOCKERS.md).

---

## 0. Preconditions

- [ ] Phase 7 automated tests green on `main` (`npm test`, CI)
- [ ] Official logo already in app `public/brand/` trees (do not redraw)
- [ ] Ibraheem owns Google Cloud / Firebase billing for **`ramkincoffee`** (Blaze for Phone Auth SMS)
- [x] `.firebaserc` default is `ramkincoffee` (never `hloe-45d43`)
- [ ] Confirm local Firebase CLI is authenticated and **not** pointed at `hloe-45d43`

---

## 1. Firebase project (`ramkincoffee`)

1. [x] Project ID **`ramkincoffee`** / number **`392513147835`** (repo wired).
2. [ ] Upgrade to **Blaze** (required for Phone Auth SMS + scheduled exports).
3. [ ] Enable Google Analytics only if Ibraheem wants it (optional).
4. [ ] On your machine: `firebase login` → `firebase use ramkincoffee` (alias `default` already in `.firebaserc`).
5. [x] Verify `.firebaserc` lists **only** `ramkincoffee` — never `hloe-45d43`.

---

## 2. Auth providers

1. [ ] **Authentication → Sign-in method → Phone** — enable; configure test numbers for UAT if needed.
2. [ ] **Email/Password** — enable (staff / OWNER).
3. [ ] Note authorized domains later when Hosting + custom domains are live.
4. [ ] Confirm SMS region / country coverage for the shop’s customer phones (see Phase 7 blockers).

---

## 3. Firestore + Functions + rules deploy

1. [ ] Create Firestore database (production mode; rules will be overwritten by deploy).
2. [ ] From repo root (after `npm ci` + `npm run build` in `functions` as needed):

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```

3. [ ] Set one-shot bootstrap secret (**not** a Vite env):

   ```bash
   firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET
   ```

   Then redeploy Functions if the secret was not bound yet: `firebase deploy --only functions`.
4. [ ] Optional until App Check Console enrollment: leave `ENFORCE_APP_CHECK` unset / false.
5. [ ] Smoke: call `helloRamkin` from Functions logs / a signed client — expect brand `RAMKIN`.

---

## 4. Web apps + Hosting (customer + admin)

1. [ ] Console → Project settings → **Add app** → Web → create **two** apps (customer + admin) or one shared web app; copy public config.
2. [ ] Copy `.env.example` → `apps/customer/.env` and `apps/admin/.env`. Paste Console **`apiKey`** + **`appId`**; confirm **`storageBucket`** (example uses `ramkincoffee.appspot.com` best-effort). **Never** put service-account JSON or `BOOTSTRAP_OWNER_SECRET` in Vite env.
3. [ ] Register Hosting targets (once per machine / CI):

   ```bash
   firebase target:apply hosting customer <SITE_ID_CUSTOMER>
   firebase target:apply hosting admin <SITE_ID_ADMIN>
   ```

   Create two Hosting sites in Console if needed (e.g. `ramkin-customer`, `ramkin-admin`).
4. [ ] Build and deploy:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. [ ] Record the two `*.web.app` / `*.firebaseapp.com` URLs for smoke tests.

**Staging channel (optional before cutover):**

```bash
firebase hosting:channel:deploy uat --only customer,admin
```

---

## 5. Custom domains

1. [ ] Hosting → customer site → **Add custom domain** (e.g. `loyalty.ramkin…` / `www…`).
2. [ ] Hosting → admin site → **Add custom domain** (e.g. `admin.ramkin…`).
3. [ ] Complete DNS TXT / A / CNAME verification with the domain registrar.
4. [ ] Auth → Settings → **Authorized domains** — add both custom hosts.
5. [ ] Update any deep-link / QR base URL env if used (`VITE_CUSTOMER_URL` / `VITE_ADMIN_URL`).

---

## 6. App Check

1. [ ] App Check → register **customer** and **admin** web apps (reCAPTCHA v3).
2. [ ] Set public `VITE_FIREBASE_APPCHECK_SITE_KEY` in both app `.env` files; rebuild + redeploy Hosting.
3. [ ] Monitor App Check metrics in debug / unenforced mode first.
4. [ ] Enforce App Check for Functions / Firestore in Console when metrics look healthy.
5. [ ] Set Functions env `ENFORCE_APP_CHECK=true` and redeploy Functions (see [MONITORING_ALERTS.md](./MONITORING_ALERTS.md)).

---

## 7. OWNER bootstrap

1. [ ] Auth → Users → **Add user** with OWNER email + strong password (or self-register email/password then bootstrap).
2. [ ] Open admin app → `/bootstrap` → submit `BOOTSTRAP_OWNER_SECRET` while signed in as that user.
3. [ ] Confirm custom claim `role: OWNER` (token refresh / sign out + in).
4. [ ] **Rotate or delete** `BOOTSTRAP_OWNER_SECRET` immediately after success.
5. [ ] Fallback (gitignored SA only): `npx tsx scripts/bootstrap-owner.local.ts --uid <UID>` — ADC must target the **RAMKIN** project only.

---

## 8. Production smoke test

Run a shortened [UAT_SCRIPT.md](./UAT_SCRIPT.md) against **production** URLs (or final custom domains):

1. [ ] Customer phone OTP register → dashboard 0/N + QR visible.
2. [ ] OWNER Settings → confirm `purchasesRequired` (default 9) / optional demo N.
3. [ ] Invite one STAFF → accept invite → Counter stamp × N.
4. [ ] Customer request reward → OWNER/MANAGER approve → staff redeem → new combo 0/N.
5. [ ] Reports → Excel + PDF download.
6. [ ] Disable a test staff account; confirm login blocked.
7. [ ] Rotate a test customer QR; confirm old token fails lookup.
8. [ ] Activity logs show purchase / reward / report / QR rotate / disable events.

---

## 9. Post-go-live (same day)

- [ ] Enable monitoring alerts ([MONITORING_ALERTS.md](./MONITORING_ALERTS.md))
- [ ] Schedule first weekly Excel backup ([OWNER_BACKUP_EXPORT.md](./OWNER_BACKUP_EXPORT.md))
- [ ] Store OWNER recovery codes + secret inventory offline ([OWNER_HANDOVER.md](./OWNER_HANDOVER.md))
- [ ] Agree post-launch support window with the engineering contact
- [ ] Keep `docs/STAFF_TRAINING.md` available at the counter

---

## Explicit non-goals for this checklist

- Do **not** invent a Firebase project ID in git.
- Do **not** commit `.env`, service accounts, or bootstrap secrets.
- Do **not** touch Hloe or `hloe-45d43`.
