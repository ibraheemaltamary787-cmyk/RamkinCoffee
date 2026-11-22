# Complete UAT report — local Fake OTP mode

**Date:** 2026-11-22  
**Environment:** Firebase Auth / Functions / Firestore **emulators** on `ramkincoffee`  
**Constraint:** Spark keep-free — no Blaze, no SMS, no Hosting publish  
**Auth:** Development Fake OTP `0000`

---

## How to reproduce (Windows)

See [`LOCAL_TESTING_GUIDE.md`](./LOCAL_TESTING_GUIDE.md). Short path:

```powershell
npm install
copy .env.example apps\customer\.env
copy .env.example apps\admin\.env
copy functions\.secret.local.example functions\.secret.local
npm run emulators
# new terminal:
npm run seed:dev-accounts
npm run dev:customer
npm run dev:admin
# optional automated:
$env:NODE_PATH="$PWD\apps\customer\node_modules"
npx tsx scripts\uat-fake-otp.local.ts
```

---

## Automated scenario results

Script: `scripts/uat-fake-otp.local.ts` (emulator + seed required).

| # | Scenario | Result |
| - | -------- | ------ |
| 1 | Invalid OTP (`1234`) rejected | PASS |
| 2 | Register new phone + OTP `0000` | PASS |
| 3 | Duplicate phone register rejected | PASS |
| 4 | Logout + re-login same uid | PASS |
| 5 | Purchase idempotency (same key) | PASS |
| 6 | Staff records 9 purchases (buy 9 get 10th) | PASS |
| 7 | Customer requests reward | PASS |
| 8 | Manager approves | PASS |
| 9 | Staff redeems | PASS |
| 10 | Combo resets to **0/9** after redeem | PASS |
| 11 | Manager rejects with reason | PASS |
| 12 | Owner export (JSON) + activity logs | PASS |

**Verdict:** Full loyalty path works under DEV Fake OTP on emulators.

---

## Manual UI checklist

| Step | App | Expected |
| ---- | --- | -------- |
| Amber **DEV OTP mode** banner | Customer + Admin | Visible when `VITE_DEV_FAKE_OTP=true` |
| Register → OTP → dashboard | Customer | Combo progress + QR |
| History / Rewards / Profile links | Customer | Own data only |
| Staff identifier + `0000` | Admin | Counter / rewards |
| Owner exports | Admin Reports | Excel/PDF/JSON from real emulator data |

---

## Security checks exercised

- Fake OTP rejected for wrong code.
- Server callable gated to Functions emulator.
- Client gate: production Vite builds cannot enable Fake OTP UI/API.
- Customers cannot self-stamp; staff records purchases via callable.
- Combo count resets only on confirmed redemption.

---

## Remaining / out of scope for keep-free

| Item | Status |
| ---- | ------ |
| Live Phone SMS | Disabled (Spark / no Blaze) |
| Cloud Functions deploy | Blocked without Blaze approval |
| Hosting publish / custom domain | Not allowed on this track |
| Persistence after refresh | Works with Auth emulator session; emulator **data** resets when emulators stop (re-seed) |

---

## Related

- [`TEST_ACCOUNTS.md`](./TEST_ACCOUNTS.md)  
- [`AUTHENTICATION_ARCHITECTURE.md`](./AUTHENTICATION_ARCHITECTURE.md)  
- [`FIREBASE_EMULATOR_DEV.md`](./FIREBASE_EMULATOR_DEV.md)  
- [`UAT_SCRIPT.md`](./UAT_SCRIPT.md)  
