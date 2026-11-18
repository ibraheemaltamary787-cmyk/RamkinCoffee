# Security rules review — Phase 6

Companion to `firestore.rules`. UI role gates are **not** security; callables + rules are.

## Posture (current)

| Collection | Client read | Client write | Notes |
|------------|-------------|--------------|-------|
| `users` | self or staff | deny | Role/status only via Admin SDK |
| `customers` | self or staff | deny | QR / loyalty profile |
| `combos` | own `customerId` or staff | deny | |
| `purchases` | own `customerId` or staff | deny | Created only by `recordPurchase` |
| `rewardRequests` | own `customerId` or staff | deny | Lifecycle via reward callables |
| `settings` | any signed-in | deny | Loyalty N readable for UI |
| `staffInvites` | OWNER / MANAGER | deny | |
| `activityLogs` | OWNER / MANAGER | deny | Append-only via Functions |
| `rateLimits` | deny | deny | Server ledger for callable throttles |
| catch-all | deny | deny | |

## Gaps closed in Phase 6

1. **`rateLimits`** — explicit deny (was only covered by catch-all; now documented + locked).
2. **`staffInvites` read** — simplified to `isManagerOrOwner()` (redundant `isOwner()` removed).
3. **Export path** — `exportReport` is OWNER/MANAGER-only; STAFF cannot pull bulk Excel/PDF.
4. **QR lookup throttle** — `lookupCustomerByQr` rate-limited per uid.
5. **App Check hooks** — soft until Console + `ENFORCE_APP_CHECK=true`.

## Penetration-style checklist

Run against staging (never production) after Functions + rules deploy:

- [ ] Unauthenticated callable (`exportReport`, `recordPurchase`, `listCustomers`) → `unauthenticated`
- [ ] CUSTOMER token calling `exportReport` / `listStaff` / `recordPurchase` → `permission-denied`
- [ ] STAFF token calling `exportReport` → `permission-denied`
- [ ] STAFF token reading `/activityLogs` via client SDK → denied by rules
- [ ] CUSTOMER reading another customer’s `purchases` / `combos` by guessed id → denied
- [ ] Client SDK `set`/`update` on `purchases`, `rewardRequests`, `settings`, `users.role` → denied
- [ ] Replay same `idempotencyKey` on `recordPurchase` → `deduped: true`, no double stamp
- [ ] Rapid `lookupCustomerByQr` / `exportReport` → `resource-exhausted` after limit
- [ ] Approve/redeem without prior request / wrong status → rejected by transaction
- [ ] Confirm no project id `hloe-45d43` in `.firebaserc`, `.env*`, or committed configs

## Residual risks (accepted for MVP)

- STAFF can list customers/purchases (needed for counter). Mitigate with App Check + activity logs + hire trust.
- Customer enumeration by staff phone/QR is intentional; tokens are unguessable random hex.
- App Check not enforced until OWNER completes Console setup (documented stub).
- Large exports capped (`limit` ≤ 2000) to protect Function memory/timeouts.

## Before production (Phase 8)

1. Enforce App Check on Functions + Firestore in Console.
2. Set `ENFORCE_APP_CHECK=true` on Functions runtime.
3. Restrict Firebase web API keys by HTTP referrer.
4. Rotate `BOOTSTRAP_OWNER_SECRET` (delete after first OWNER).
5. Review IAM: least-privilege CI deploy SA; no service-account JSON in repo.
