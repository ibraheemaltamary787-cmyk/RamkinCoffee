# RAMKIN Coffee

Digital loyalty & rewards platform for **RAMKIN** — buy-N-get-1-free stamp cards, staff-recorded purchases, and a request → approve → redeem reward flow.

Greenfield monorepo. **Do not** reuse the Hloe app or Firebase project `hloe-45d43`.

## Repository layout

```text
apps/customer     Vite + React + TS + Tailwind — customer site
apps/admin        Vite + React + TS + Tailwind — staff / admin
packages/shared   Shared types, constants, helpers
functions         Firebase Cloud Functions (TypeScript)
firebase.json     Hosting + Functions + Firestore wiring
firestore.rules   Deny-by-default skeleton
```

Official brand mark (unmodified): `apps/customer/public/brand/ramkin-logo.jpg` (also copied under `apps/admin/public/brand/`).

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
| `npm test` | Stub / unit tests |
| `npm run format` | Prettier write |

## Firebase project (owner steps)

Phase 2 leaves placeholders until a dedicated RAMKIN Firebase project exists.

1. Open [Firebase Console](https://console.firebase.google.com/) signed in as the RAMKIN owner.
2. **Add project** → name e.g. `ramkin-coffee` (any unique ID **except** `hloe-45d43`).
3. Enable **Google Analytics** only if desired (optional for MVP).
4. Upgrade to **Blaze** when you need Phone Auth / production Functions (required before Phase 3 OTP).
5. In the new project, enable:
   - **Authentication** → Sign-in providers: **Phone**, **Email/Password**
   - **Cloud Firestore** (production mode is fine; we deploy rules from this repo)
   - **Functions**
   - **Hosting** (two sites recommended: customer + admin)
6. Register two **Web** apps (customer + admin) and copy the public config into each app `.env` (`VITE_FIREBASE_*` only).
7. Locally, with Firebase CLI logged in as the same Google account:

   ```bash
   firebase login
   firebase use --add   # select the NEW ramkin project (writes .firebaserc)
   # .firebaserc ships empty on purpose until a real RAMKIN project ID exists
   firebase target:apply hosting customer <customer-site-id>
   firebase target:apply hosting admin <admin-site-id>
   ```

8. Deploy foundation (after `npm run build`):

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```

9. Smoke-test callable `helloRamkin` from the Functions console or a temporary client call.

**Hard rules**

- Never point `.firebaserc` at `hloe-45d43`.
- Never commit service-account JSON or private keys.
- `.env.example` documents **public** Vite keys only.

## Bootstrap first OWNER (outline — Phase 3)

Custom claims are set only via Admin SDK. Outline for Phase 3 (not implemented yet):

1. Create the owner Auth user in Firebase Console (Email/Password) **or** via Admin SDK.
2. Run a one-shot privileged script / callable (gated by a bootstrap secret or first-run empty-OWNER check) that:
   - Sets Auth custom claim `{ role: "OWNER" }`
   - Writes `users/{uid}` with `role: "OWNER"`, `status: "active"`
   - Appends an `activityLogs` entry
3. Disable or delete the bootstrap path so it cannot be reused.
4. Thereafter only OWNER may grant `MANAGER` / `STAFF`.

Stub callable `bootstrapOwner` currently returns `failed-precondition` until Phase 3 wires this safely.

## Security posture (Phase 2)

- `firestore.rules` **deny all** client reads/writes.
- Privileged mutations will go through Cloud Functions in later phases.
- Admin UI routes are UX only — not security.

## Phase status

| Phase | Status |
|-------|--------|
| 1 Docs / architecture | Approved |
| 2 Repo + tooling + Firebase foundation | This scaffold |
| 3 Auth / RBAC | Not started |
| 4 Loyalty engine | Not started |

See Project store docs: `ARCHITECTURE.md`, `DEVELOPMENT_ROADMAP.md`, `PROJECT_CONTEXT.md`.
