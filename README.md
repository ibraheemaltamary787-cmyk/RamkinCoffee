# RAMKIN Coffee

Digital loyalty & rewards platform for **RAMKIN** — buy-N-get-1-free stamp cards, staff-recorded purchases, and a request → approve → redeem reward flow.

Greenfield monorepo. **Do not** reuse the Hloe app or Firebase project `hloe-45d43`.

## Repository layout

```text
apps/customer     Vite + React + TS + Tailwind — customer site (phone OTP)
apps/admin        Vite + React + TS + Tailwind — staff / admin (email/password)
packages/shared   Shared types, Zod schemas, role helpers
functions         Firebase Cloud Functions (TypeScript) — auth callables
firebase.json     Hosting + Functions + Firestore wiring
firestore.rules   Phase 3 narrow reads; privileged writes denied to clients
scripts/          OWNER bootstrap outline + local Admin SDK helper
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

| Command | Purpose |
|---------|---------|
| `npm install` | Install all workspaces |
| `npm run dev:customer` | Customer app on http://localhost:5173 |
| `npm run dev:admin` | Admin app on http://localhost:5174 |
| `npm run build` | Build shared → apps → functions |
| `npm run build:apps` | Build shared + both Vite apps |
| `npm run typecheck` | Typecheck all packages |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run format` | Prettier write |

## Phase 3 — Auth & RBAC

### Customer (phone OTP)

1. Enable **Authentication → Phone** in the RAMKIN Firebase project (Blaze typically required for SMS).
2. Or use **Auth Emulator** + `VITE_USE_FIREBASE_EMULATORS=true` for local OTP without SMS.
3. Customer app routes: `/` · `/register` · `/login` · `/dashboard` · `/profile`.
4. After OTP, the app calls `ensureCustomerProfile` (sets `CUSTOMER` claim + `users` / `customers` docs) and `recordLogin`.

### Staff / admin (email + password)

1. Enable **Email/Password** provider.
2. Admin app: `/login` → role-gated `/app` shell; `/bootstrap` for first OWNER.
3. Callables: `bootstrapOwner`, `setStaffRole`, `disableAccount`, `recordLogin`.

### Bootstrap first OWNER

1. Create the owner Auth user (Console → Authentication → Add user).
2. Set the Functions secret (never commit; never put in Vite):

   ```bash
   firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET
   firebase deploy --only functions
   ```

3. Sign in on the admin app → you will be sent to `/bootstrap` until a staff claim exists.
4. Paste the same secret → callable sets `{ role: "OWNER" }`, writes `users/{uid}`, logs `role.bootstrap_owner`.
5. Force token refresh (automatic after success) and **rotate/delete** the secret.
6. Optional local script: `npx tsx scripts/bootstrap-owner.local.ts --uid <UID>` with gitignored ADC/service account. See `scripts/bootstrap-owner.outline.md`.

### Security posture (Phase 3)

- Custom claims set **only** via Admin SDK in Functions.
- Firestore: clients may **read** own `users`/`customers` (staff may read too); **all client writes denied**.
- Profile updates, role changes, disable, login audit → callables + `activityLogs`.
- Admin route hiding is UX only.

## Firebase project (owner steps)

Phase 2/3 leave **placeholders** until a dedicated RAMKIN Firebase project exists.

1. Open [Firebase Console](https://console.firebase.google.com/) as the RAMKIN owner.
2. **Add project** → unique ID **except** `hloe-45d43`.
3. Upgrade to **Blaze** when you need Phone Auth / production Functions.
4. Enable Auth (Phone + Email/Password), Firestore, Functions, Hosting.
5. Register web apps; copy public config into each app `.env` (`VITE_FIREBASE_*` only).
6. `firebase use --add` → select the new project (`.firebaserc` ships empty on purpose).
7. Deploy: `firebase deploy --only firestore:rules,firestore:indexes,functions`

**Hard rules**

- Never point `.firebaserc` at `hloe-45d43`.
- Never commit service-account JSON or private keys.
- `.env.example` documents **public** Vite keys only; `BOOTSTRAP_OWNER_SECRET` is Functions-only.

## What works with placeholders vs needs Console

| Capability | Placeholders / CI | Needs real Firebase |
|------------|-------------------|---------------------|
| Typecheck / lint / test / build | ✓ | — |
| Auth UI flows (forms, routing, branding) | ✓ | Live Auth to complete OTP / email sign-in |
| Phone OTP SMS | — | Phone provider + Blaze (or Auth Emulator) |
| Custom claims / callables | Code present | Deploy Functions + secrets |
| Firestore reads of profile | Rules ready | Deploy rules + create docs via callables |

## Phase status

| Phase | Status |
|-------|--------|
| 1 Docs / architecture | Approved |
| 2 Repo + tooling + Firebase foundation | On `main` |
| 3 Auth / RBAC | This branch |
| 4 Loyalty engine | Not started |
