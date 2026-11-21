# RAMKIN Coffee

Digital loyalty & rewards platform for **RAMKIN** — buy-N-get-1-free stamp cards, staff-recorded purchases, and a request → approve → redeem reward flow.

Greenfield monorepo. **Do not** reuse the Hloe app or Firebase project `hloe-45d43`.

## Repository layout

```text
apps/customer     Vite + React + TS + Tailwind — customer site (phone OTP + progress)
apps/admin        Vite + React + TS + Tailwind — staff / admin (counter, rewards, reports)
packages/shared   Shared types, Zod schemas, loyalty state machine, report columns
functions         Firebase Cloud Functions — auth + loyalty + export callables
docs/             Launch checklist, ops runbook, UAT, security, handover
firebase.json     Hosting + Functions + Firestore wiring
firestore.rules   Narrow reads; rateLimits denied; privileged writes via Functions
scripts/          OWNER bootstrap + loyalty seed (dry-run + staging ADC)
```

Official brand mark (unmodified): `apps/customer/public/brand/ramkin-logo.jpg` (also under `apps/admin/public/brand/` and `functions/assets/brand/` for PDF — binary copy only, not redrawn).

## Prerequisites

- Node.js **20+**
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`) when linking a project
- Firebase project **`ramkincoffee`** (project number `392513147835`) owned by Ibraheem / RAMKIN (never `hloe-45d43`)

## Setup

```bash
git clone https://github.com/ibraheemaltamary787-cmyk/RamkinCoffee.git
cd RamkinCoffee
npm install
cp .env.example apps/customer/.env
cp .env.example apps/admin/.env
# .env.example already has projectId / authDomain / messagingSenderId for ramkincoffee.
# Paste VITE_FIREBASE_API_KEY + VITE_FIREBASE_APP_ID from Console → Web app; confirm storageBucket.
```

### Scripts

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm install`          | Install all workspaces                      |
| `npm run dev:customer` | Customer app on http://localhost:5173       |
| `npm run dev:admin`    | Admin app on http://localhost:5174          |
| `npm run build`        | Build shared → apps → functions             |
| `npm run build:apps`   | Build shared + both Vite apps               |
| `npm run typecheck`    | Typecheck all packages                      |
| `npm run lint`         | ESLint                                      |
| `npm test`             | Unit tests (loyalty, RBAC, security hygiene)|
| `npm run format`       | Prettier write                              |

## Phase 8 — Production launch prep (docs + ops)

| Artifact | Purpose |
|----------|---------|
| [`docs/PRODUCTION_LAUNCH_CHECKLIST.md`](docs/PRODUCTION_LAUNCH_CHECKLIST.md) | Firebase → Auth → deploy → Hosting → domains → App Check → OWNER → smoke |
| [`docs/OPS_RUNBOOK.md`](docs/OPS_RUNBOOK.md) | Change N, invite staff, rotate QR, export, disable accounts, incidents |
| [`docs/MONITORING_ALERTS.md`](docs/MONITORING_ALERTS.md) | Functions errors, Auth spikes, budgets — Console steps + YAML sketch |
| [`docs/OWNER_HANDOVER.md`](docs/OWNER_HANDOVER.md) | What Ibraheem must set; no real secrets in repo |
| Callable `rotateCustomerQr` | OWNER/MANAGER — invalidate leaked counter QR from customer detail |

**Firebase project linked in repo:** `.firebaserc` default is `ramkincoffee` (never `hloe-45d43`). Live Hosting / Auth / Functions deploy still needs Console web config (`apiKey`, `appId`), Auth providers, and an authenticated CLI session (`firebase login` → `firebase use ramkincoffee` → deploy). Cost / Spark vs Blaze gates: [`docs/FIREBASE_COST_REPORT.md`](docs/FIREBASE_COST_REPORT.md) — **do not upgrade to Blaze or enable paid SMS without OWNER approval**.

## Phase 7 — Testing, UAT prep, security verification

| Artifact | Purpose |
|----------|---------|
| Expanded unit tests | Loyalty state machine + Architecture RBAC matrix + App Check / config hygiene |
| [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md) | Pass/fail vs codebase + residual risks |
| [`docs/UAT_SCRIPT.md`](docs/UAT_SCRIPT.md) | register→stamp→request→approve→redeem→report |
| [`docs/STAFF_TRAINING.md`](docs/STAFF_TRAINING.md) | One-pager: stamp, approve, reject, redeem, phone/QR |
| [`docs/PHASE7_LIVE_BLOCKERS.md`](docs/PHASE7_LIVE_BLOCKERS.md) | What needs a real Firebase project |
| `npx tsx scripts/seed-loyalty-demo.local.ts --dry-run` | Demo fixture plan without secrets |

**Staging Hosting / live OTP UAT is blocked** until web `apiKey`/`appId` are provided, Auth providers are enabled on `ramkincoffee`, and Functions/Hosting are deployed (never `hloe-45d43`).

## Phase 6 — Reporting, exports, and hardening

| Route / artifact                         | Who             | Purpose                                              |
| ---------------------------------------- | --------------- | ---------------------------------------------------- |
| `/app/reports`                           | OWNER / MANAGER | Date / status / search filters; Excel + PDF + print  |
| Customer detail **Print history**        | staff+          | Print-friendly individual history                    |
| Callable `exportReport`                  | OWNER / MANAGER | Authorized data → xlsx / pdf / json preview          |
| `docs/SECURITY_RULES_REVIEW.md`          | ops             | Rules matrix + penetration-style checklist           |
| `docs/OWNER_BACKUP_EXPORT.md`            | OWNER           | Backup / export runbook                             |
| App Check stubs + `rateLimits`           | platform        | Soft until Console setup; QR + export throttles      |

### Export callable

| Callable       | Who             | Purpose                                                                 |
| -------------- | --------------- | ----------------------------------------------------------------------- |
| `exportReport` | OWNER / MANAGER | Filters: `from`, `to`, `search`, `recordedBy`, `rewardStatus`, `sheets` |

Excel sheets use real headers (`Customer ID`, `Display Name`, `Purchase ID`, …). PDF embeds the official logo from `functions/assets/brand/ramkin-logo.jpg`.

### App Check (Console required)

1. Firebase Console → App Check → register customer + admin web apps (reCAPTCHA v3).
2. Set public site key in app `.env` as `VITE_FIREBASE_APPCHECK_SITE_KEY`.
3. Enforce in Console, then set Functions env `ENFORCE_APP_CHECK=true`.
4. Until then, Auth + RBAC + Firestore rate limits still apply.

## Phase 5 — Staff / admin product surfaces

Admin routes (role-gated UX; Functions remain authoritative):

| Route               | Who             | Purpose                                                 |
| ------------------- | --------------- | ------------------------------------------------------- |
| `/app`              | staff+          | Live stats overview                                     |
| `/app/counter`      | staff+          | Phone / QR paste / camera scan + stamp / reward actions |
| `/app/rewards`      | staff+          | Open rewards queue (approve / reject / redeem)          |
| `/app/customers`    | staff+          | Search + customer detail / history                      |
| `/app/transactions` | staff+          | Purchase list + filters                                 |
| `/app/reports`      | OWNER / MANAGER | Excel / PDF / print (Phase 6)                           |
| `/app/accounts`     | OWNER / MANAGER | Staff list, invites, role assign, disable               |
| `/app/settings`     | OWNER           | `purchasesRequired` + staff-can-approve                 |
| `/app/activity`     | OWNER / MANAGER | Activity log viewer                                     |

Customer dashboard shows a scannable counter QR (official logo unchanged).

### Phase 5 admin callables

| Callable                                                       | Who                         | Purpose                                           |
| -------------------------------------------------------------- | --------------------------- | ------------------------------------------------- |
| `getAdminStats`                                                | staff+                      | Totals + today’s purchases + reward status counts |
| `listCustomers` / `getCustomerDetail`                          | staff+                      | Search + detail with purchases/rewards/combos     |
| `listPurchases`                                                | staff+                      | Filters: customer, staff, date range              |
| `listActivityLogs`                                             | OWNER / MANAGER             | Audit trail                                       |
| `listStaff`                                                    | OWNER / MANAGER             | Staff directory                                   |
| `createStaffInvite` / `listStaffInvites` / `cancelStaffInvite` | OWNER (MANAGER: STAFF only) | Invite workflow                                   |
| `acceptStaffInvite`                                            | signed-in invitee           | Claim role from pending invite                    |

## Phase 4 — Loyalty engine

### Hard rules (enforced in `@ramkin/shared` + Functions transactions)

1. **Customers never self-stamp** — only `recordPurchase` (staff+) creates purchases.
2. **Combo resets only on `redeemReward`** — request/approve leave `purchaseCount` intact.
3. **History preserved** — old combos/purchases/requests stay; redeem opens a **new** combo.
4. **No duplicate open rewards** — one open request pointer per combo.
5. **Idempotency** — `purchases/{idempotencyKey}` prevents double submits; Firestore transactions serialize concurrent stamps.

### Callables

| Callable                                       | Who                                 | Purpose                                                          |
| ---------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `getLoyaltySettings` / `updateLoyaltySettings` | any signed-in / OWNER               | Singleton `settings/loyalty` (`purchasesRequired` default **9**) |
| `getLoyaltyProgress`                           | customer (or staff with id)         | Dashboard DTO                                                    |
| `lookupCustomerByPhone` / `lookupCustomerByQr` | staff+                              | Counter lookup (QR rate-limited)                                 |
| `rotateCustomerQr`                             | OWNER / MANAGER                     | Invalidate leaked counter QR                                     |
| `recordPurchase`                               | staff+                              | Stamp with idempotency key                                       |
| `requestReward`                                | customer                            | → `reward_pending`                                               |
| `approveReward` / `rejectReward`               | manager/owner (staff if setting on) | No reset; reject needs reason                                    |
| `redeemReward`                                 | staff+                              | Confirm free drink → new combo                                   |
| `listOpenRewards`                              | staff+                              | Queue for approve/redeem                                         |

Registration (`ensureCustomerProfile`) auto-creates the first active combo + QR token.

### Demo the state machine

1. Lower N for a short demo: admin **Settings** → `purchasesRequired: 2` (OWNER) — applies to **new** combos only.
2. Customer registers → dashboard **0 / N** gold bar.
3. Admin **Counter** → phone/QR lookup → **Record purchase** × N → combo `completed`.
4. Customer **Request reward** → still N/N, status pending.
5. Admin **Approve** → still N/N; **Reject** (with reason) returns to completed for re-request.
6. Admin **Confirm redeem** → old combo `redeemed`, customer back at **0 / N**.
7. Re-submit the same `idempotencyKey` → `deduped: true`.

See `scripts/seed-loyalty-demo.outline.md` and `scripts/seed-loyalty-demo.local.ts` (`--dry-run` safe without Firebase).

### Security posture

- Client writes on purchases / combos / rewardRequests / settings / activityLogs / rateLimits: **denied**.
- Customers may read own combos/purchases/requests; staff may read for counter.
- Activity logs: `purchase.recorded`, `reward.*`, `settings.loyalty_updated`, `customer.lookup`, `report.exported`.
- Full checklist: [`docs/SECURITY_RULES_REVIEW.md`](docs/SECURITY_RULES_REVIEW.md).
- OWNER backup steps: [`docs/OWNER_BACKUP_EXPORT.md`](docs/OWNER_BACKUP_EXPORT.md).

## Phase 3 — Auth & RBAC

### Customer (phone OTP)

1. Enable **Authentication → Phone** (Blaze typically required for SMS) or Auth Emulator.
2. Routes: `/` · `/register` · `/login` · `/dashboard` · `/profile`.

### Staff / admin (email + password)

1. Enable **Email/Password** provider.
2. Routes: `/login` → `/app` · counter · rewards · customers · transactions · reports · accounts · settings · activity · `/bootstrap`.

### Bootstrap first OWNER

1. Create the owner Auth user in Console.
2. `firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET` then deploy Functions.
3. Admin `/bootstrap` with the secret → `{ role: "OWNER" }`.
4. Rotate/delete the secret. Optional: `npx tsx scripts/bootstrap-owner.local.ts --uid <UID>`.

## Firebase project (owner steps)

**Project ID:** `ramkincoffee` · **Project number:** `392513147835` · **Never** `hloe-45d43`.

1. Confirm Blaze + enable Auth (Phone + Email/Password), Firestore, Functions, Hosting.
2. Console → Project settings → Web app → copy `apiKey` and `appId` into gitignored `apps/*/.env` (projectId / authDomain / messagingSenderId are already in `.env.example`; confirm `storageBucket`).
3. Authenticated machine:

   ```bash
   firebase login
   firebase use ramkincoffee
   npm run build
   firebase deploy --only firestore:rules,firestore:indexes,functions
   # then Hosting after sites/targets + VITE_* filled for the build
   ```

4. (Phase 6+) enroll App Check; optional Firestore scheduled export — see OWNER runbook.

**Hard rules:** never commit service-account JSON; never put `BOOTSTRAP_OWNER_SECRET` in Vite env.

## Phase status

| Phase                                  | Status                                      |
| -------------------------------------- | ------------------------------------------- |
| 1 Docs / architecture                  | Approved                                    |
| 2 Repo + tooling + Firebase foundation | On `main`                                   |
| 3 Auth / RBAC                          | On `main`                                   |
| 4 Loyalty engine                       | On `main`                                   |
| 5 Staff / admin product surfaces       | On `main`                                   |
| 6 Reports / exports / hardening        | On `main`                                   |
| 7 Testing / UAT prep / security verify | On `main` (live Firebase still required)    |
| 8 Production launch prep / handover    | On `main` — project `ramkincoffee` wired; go-live needs web keys + CLI deploy |