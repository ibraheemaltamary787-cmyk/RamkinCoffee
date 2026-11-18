# RAMKIN Coffee

Digital loyalty & rewards platform for **RAMKIN** — buy-N-get-1-free stamp cards, staff-recorded purchases, and a request → approve → redeem reward flow.

Greenfield monorepo. **Do not** reuse the Hloe app or Firebase project `hloe-45d43`.

## Repository layout

```text
apps/customer     Vite + React + TS + Tailwind — customer site (phone OTP + progress)
apps/admin        Vite + React + TS + Tailwind — staff / admin (counter, rewards, settings)
packages/shared   Shared types, Zod schemas, loyalty state machine
functions         Firebase Cloud Functions — auth + loyalty callables
firebase.json     Hosting + Functions + Firestore wiring
firestore.rules   Phase 5 narrow reads; privileged writes denied to clients
scripts/          OWNER bootstrap + loyalty seed/demo outline
```

Official brand mark (unmodified): `apps/customer/public/brand/ramkin-logo.jpg` (also under `apps/admin/public/brand/`).

## Prerequisites

- Node.js **20+**
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`) when linking a project
- A **new** Firebase project owned by Ibraheem / RAMKIN (never `hloe-45d43`)

## Setup

```bash
git clone https://github.com/ibraheemaltamary787-cmyk/RamkinCoffee.git
cd RamkinCoffee
npm install
cp .env.example apps/customer/.env
cp .env.example apps/admin/.env
# Fill VITE_FIREBASE_* from Firebase Console → Project settings → Web app
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
| `npm test`             | Unit tests (includes loyalty state machine) |
| `npm run format`       | Prettier write                              |

## Phase 5 — Staff / admin product surfaces

Admin routes (role-gated UX; Functions remain authoritative):

| Route               | Who             | Purpose                                                 |
| ------------------- | --------------- | ------------------------------------------------------- |
| `/app`              | staff+          | Live stats overview                                     |
| `/app/counter`      | staff+          | Phone / QR paste / camera scan + stamp / reward actions |
| `/app/rewards`      | staff+          | Open rewards queue (approve / reject / redeem)          |
| `/app/customers`    | staff+          | Search + customer detail / history                      |
| `/app/transactions` | staff+          | Purchase list + filters                                 |
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
| `lookupCustomerByPhone` / `lookupCustomerByQr` | staff+                              | Counter lookup                                                   |
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

See `scripts/seed-loyalty-demo.outline.md` for a staging seed outline.

### Security posture (Phase 4)

- Client writes on purchases / combos / rewardRequests / settings / activityLogs: **denied**.
- Customers may read own combos/purchases/requests; staff may read for counter.
- Activity logs: `purchase.recorded`, `reward.*`, `settings.loyalty_updated`, `customer.lookup`.

## Phase 3 — Auth & RBAC

### Customer (phone OTP)

1. Enable **Authentication → Phone** (Blaze typically required for SMS) or Auth Emulator.
2. Routes: `/` · `/register` · `/login` · `/dashboard` · `/profile`.

### Staff / admin (email + password)

1. Enable **Email/Password** provider.
2. Routes: `/login` → `/app` · counter · rewards · customers · transactions · accounts · settings · activity · `/bootstrap`.

### Bootstrap first OWNER

1. Create the owner Auth user in Console.
2. `firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET` then deploy Functions.
3. Admin `/bootstrap` with the secret → `{ role: "OWNER" }`.
4. Rotate/delete the secret. Optional: `npx tsx scripts/bootstrap-owner.local.ts --uid <UID>`.

## Firebase project (owner steps)

1. Create a **new** Firebase project (never `hloe-45d43`).
2. Enable Auth (Phone + Email/Password), Firestore, Functions, Hosting.
3. Copy public web config into app `.env` files (`VITE_FIREBASE_*` only).
4. `firebase use --add` → deploy rules, indexes, functions.

**Hard rules:** never commit service-account JSON; never put `BOOTSTRAP_OWNER_SECRET` in Vite env.

## Phase status

| Phase                                  | Status      |
| -------------------------------------- | ----------- |
| 1 Docs / architecture                  | Approved    |
| 2 Repo + tooling + Firebase foundation | On `main`   |
| 3 Auth / RBAC                          | On `main`   |
| 4 Loyalty engine                       | On `main`   |
| 5 Staff / admin product surfaces       | This branch |
| 6+ Reports / harden / launch           | Not started |
