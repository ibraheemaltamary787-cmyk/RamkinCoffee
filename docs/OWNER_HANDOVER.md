# OWNER credentials & handover — RAMKIN Coffee

**Audience:** Ibraheem (business OWNER)  
**Rule:** No real secrets belong in this repository. This doc lists **what you must set** and **where**, never example passwords or live keys.

**Hard ban:** Never reuse Hloe Firebase project `hloe-45d43`.

---

## 1. What Ibraheem must create / own

| Item | Where | Notes |
|------|-------|-------|
| New Firebase / GCP project | Firebase Console | Name/ID of your choosing; Blaze for Phone SMS |
| Billing account | Google Cloud Billing | Linked only to the RAMKIN project |
| OWNER Auth user | Firebase Auth (email/password) | Strong unique password + recovery email |
| `BOOTSTRAP_OWNER_SECRET` | Firebase Secret Manager / Functions secrets | Random ≥16 chars; **one-shot**; delete after bootstrap |
| Web app public config | Project settings → Web apps | Copied into gitignored `apps/*/.env` as `VITE_FIREBASE_*` |
| reCAPTCHA v3 site key | App Check | Public; safe in Vite env as `VITE_FIREBASE_APPCHECK_SITE_KEY` |
| Custom domains + DNS | Registrar + Hosting | Customer + admin hosts |
| Domain authorized list | Auth → Settings | Must include Hosting + custom domains |
| Optional break-glass SA JSON | Local machine only | Gitignored; ADC for `bootstrap-owner.local.ts` / seed — **never commit** |
| Offline recovery pack | Password manager / sealed note | OWNER password, recovery codes, budget alerts email |

---

## 2. What engineering already prepared (no secrets)

- Monorepo apps, Functions, rules, indexes, CI
- `.env.example` documenting **public** Vite keys only
- `bootstrapOwner` callable + `scripts/bootstrap-owner.local.ts`
- Launch checklist, ops runbook, monitoring guide, UAT / staff / backup docs
- Empty `.firebaserc` until you link the real project (`projects: {}` today)

---

## 3. Secret inventory (checkboxes — fill privately)

Copy this list into a **private** password manager entry — do not PR the filled values.

- [ ] Firebase project ID: `________________`
- [ ] OWNER login email: `________________`
- [ ] OWNER password: *(password manager)*
- [ ] `BOOTSTRAP_OWNER_SECRET`: *(deleted after use — note “rotated on ____”)*
- [ ] Customer Hosting URL / custom domain: `________________`
- [ ] Admin Hosting URL / custom domain: `________________`
- [ ] App Check site key: *(public; also in deploy env)*
- [ ] GCS backup bucket (if PITR/export enabled): `________________`
- [ ] Billing budget alert email: `________________`
- [ ] Engineering support contact for post-launch window: `________________`

---

## 4. Bootstrap sequence (short)

1. Create project + enable Phone + Email/Password (see [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md)).
2. Deploy rules, indexes, Functions.
3. `firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET`
4. Create OWNER Auth user → admin `/bootstrap` with the secret → confirm `role: OWNER`.
5. **Delete / rotate** the bootstrap secret the same day.
6. Invite MANAGER/STAFF via **Accounts** — never share OWNER password.
7. Enroll App Check before heavy marketing traffic; then `ENFORCE_APP_CHECK=true`.

---

## 5. What never goes in git / Vite

- Service account JSON / private keys  
- `BOOTSTRAP_OWNER_SECRET`  
- OWNER passwords / OTP codes  
- Filled `.env` files  
- Anything from `hloe-45d43`

CI and Hosting builds may inject `VITE_FIREBASE_*` as build-time public config; treat Admin SDK credentials as **Functions runtime / Secret Manager only**.

---

## 6. Post-launch support window (agree explicitly)

Suggested default (edit when you confirm):

- **Stabilization window:** first 7–14 days after production DNS cutover  
- **In scope:** blocking bugs on stamp / reward / OTP / deploy  
- **Out of scope:** new features, multi-branch, new languages — new roadmap items  
- **Owner duties during window:** monitor billing SMS, complete weekly Excel backup, escalate with timestamps

---

## 7. Handover acceptance

When live:

- [ ] Ibraheem can sign in as OWNER on the admin custom domain  
- [ ] Staff can stamp without Firebase Console  
- [ ] Reports Excel/PDF download works  
- [ ] Backup runbook followed once  
- [ ] Alerts email received for a test (optional)  
- [ ] Bootstrap secret removed  

Until the Firebase project exists, production remains **awaiting Firebase from Ibraheem**.
