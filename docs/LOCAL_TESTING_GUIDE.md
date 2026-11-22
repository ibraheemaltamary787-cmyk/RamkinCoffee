# Local testing guide (Windows + Spark keep-free)

**Project:** `ramkincoffee` (never `hloe-45d43`)  
**Constraint:** No Blaze, no paid SMS, no Hosting publish, no domain purchase.  
**Auth for local UAT:** Development Fake OTP **`0000`** (disabled in production builds).

---

## Prerequisites (Windows)

1. Install **Node.js 22+** (LTS) from [nodejs.org](https://nodejs.org/) — include npm.
2. Open **PowerShell** or **Windows Terminal**.
3. Optional: install [Git for Windows](https://git-scm.com/) if cloning.

```powershell
node -v   # should be v22.x or newer
npm -v
```

---

## One-time setup

```powershell
git clone https://github.com/ibraheemaltamary787-cmyk/RamkinCoffee.git
cd RamkinCoffee
npm install

copy .env.example apps\customer\.env
copy .env.example apps\admin\.env
copy functions\.secret.local.example functions\.secret.local
```

Confirm both app `.env` files include:

```env
VITE_USE_FIREBASE_EMULATORS=true
VITE_DEV_FAKE_OTP=true
```

`VITE_DEV_FAKE_OTP=true` is **DEV only**. Production Hosting builds must leave it unset/`false`. Vite also blocks Fake OTP when `import.meta.env.PROD` is true.

**After copying `.env`, restart Vite** (`Ctrl+C` then `npm run dev:customer` / `dev:admin`). Vite only reads env at startup.

`npm run emulators` builds `@ramkin/shared` then Functions before starting — do not skip Terminal A.

---

## Start the local stack (3 terminals)

### Terminal A — emulators

```powershell
npm run emulators
```

Wait until: `All emulators ready!`  
Emulator UI: http://127.0.0.1:4000

If the Functions build fails with `Cannot find module '@ramkin/shared'`, run `npm run build -w @ramkin/shared` once, then retry `npm run emulators`.

| Service   | Port |
| --------- | ---- |
| Auth      | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| UI        | 4000 |

### Terminal B — seed Fake OTP accounts (once per emulator restart)

```powershell
npm run seed:dev-accounts
```

See [`TEST_ACCOUNTS.md`](./TEST_ACCOUNTS.md) for identifiers and phones.

### Terminal C — apps

```powershell
npm run dev:customer
# http://localhost:5173

npm run dev:admin
# http://localhost:5174
```

Both apps show an amber **DEV OTP mode** banner when Fake OTP is enabled.

---

## Quick smoke (manual)

1. Customer http://localhost:5173 → **Register** → name + phone (e.g. `+15550101999`) → OTP **`0000`** → dashboard.
2. Sign out → **Sign in** with same phone + `0000`.
3. Admin http://localhost:5174 → `staff1@ramkin.local` + OTP **`0000`** → Counter → look up customer phone → add stamps.
4. Customer dashboard → request reward when 9/9.
5. Admin as `manager@ramkin.local` → Rewards → approve.
6. Admin as `staff1@ramkin.local` → redeem → customer combo shows **0/9**.
7. Admin as `owner@ramkin.local` → Reports export + Activity logs.

Automated emulator script (from repo root, with emulators + seed already running):

```powershell
$env:NODE_PATH="$PWD\apps\customer\node_modules"
npx tsx scripts\uat-fake-otp.local.ts
```

---

## Windows notes

- If `firebase` / emulators fail on Java: install a recent **JDK 17+** and ensure `java -version` works in the same terminal.
- Prefer `127.0.0.1` over `localhost` if Auth emulator CORS/IPv6 issues appear.
- Do **not** run `firebase deploy` for Hosting or Functions on Spark keep-free.
- Closing Terminal A wipes Auth/Firestore emulator data — re-run `npm run seed:dev-accounts`.

## Troubleshooting Fake OTP (`0000`)

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| `INTERNAL` / “internal” after entering `0000` | Functions threw (bad input / token mint) or emulators miswired | Read **Terminal A** Functions log. Confirm amber **Local Firebase emulators** + **DEV OTP mode** banners. Restart emulators, re-seed, restart Vite. |
| `Functions emulator not reachable` / `not-found` | Vite not using emulators, or Functions not running | `VITE_USE_FIREBASE_EMULATORS=true` in both app `.env` files; Terminal A must include **Functions** on port **5001**; restart Vite. |
| No account / run seed first | Emulator Auth empty after restart | `npm run seed:dev-accounts` |
| Invalid OTP | Code is not exactly `0000` | Use ASCII `0000` (not Arabic-Indic digits) |
| No DEV OTP banner | Fake OTP off in this build | Set `VITE_DEV_FAKE_OTP=true`, use `npm run dev:*` (not a production build), restart Vite |

Hard rules: never project `hloe-45d43`; no Blaze upgrade; no Hosting publish; Fake OTP stays DEV-only.

---

## Related docs

- [`TEST_ACCOUNTS.md`](./TEST_ACCOUNTS.md) — seeded identifiers / phones  
- [`AUTHENTICATION_ARCHITECTURE.md`](./AUTHENTICATION_ARCHITECTURE.md) — Fake OTP vs production  
- [`FIREBASE_EMULATOR_DEV.md`](./FIREBASE_EMULATOR_DEV.md) — emulator ports and callables  
- [`COMPLETE_UAT_REPORT.md`](./COMPLETE_UAT_REPORT.md) — UAT evidence  
- [`UAT_SCRIPT.md`](./UAT_SCRIPT.md) — longer manual script  
