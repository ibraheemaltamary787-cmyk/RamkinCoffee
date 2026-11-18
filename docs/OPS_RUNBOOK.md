# Ops runbook — RAMKIN Coffee

Day-to-day owner/manager operations after go-live. UI is convenience; **Cloud Functions + claims** are authoritative.

Related: [STAFF_TRAINING.md](./STAFF_TRAINING.md) · [OWNER_BACKUP_EXPORT.md](./OWNER_BACKUP_EXPORT.md) · [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md).

---

## Change loyalty N (`purchasesRequired`)

**Who:** OWNER only  
**Where:** Admin → **Settings**

1. Sign in as OWNER.
2. Open **Settings**.
3. Set **Purchases required** (paid stamps before free drink). Default production value: **9** (buy 9 → 10th free).
4. Optionally toggle **Staff can approve rewards**.
5. Save. Activity log: `settings.loyalty_updated`.

**Important:** New N applies to **new combos only**. In-progress cards keep the `requiredPurchases` snapshot from when they started.

---

## Invite staff

**Who:** OWNER (any staff role); MANAGER may invite **STAFF** only  
**Where:** Admin → **Accounts**

1. **Accounts** → create invite (email + intended role).
2. Share the invite acceptance path with the teammate (they create/sign in with that email/password, then accept).
3. Confirm they appear in the staff list with the correct role claim.
4. Cancel unused invites from the same screen.

Do **not** share OWNER credentials. One Auth user per person for audit (`activityLogs`).

---

## Rotate customer QR

**Who:** OWNER or MANAGER  
**Where:** Admin → **Customers** → customer detail → **Rotate QR**  
**Callable:** `rotateCustomerQr`

Use when a phone is lost, a QR screenshot leaked, or a printed code may be abused.

1. Look up the customer.
2. Click **Rotate QR** and confirm.
3. Old token / deep links stop resolving immediately.
4. Ask the customer to refresh their dashboard to show the new QR.
5. Activity log: `customer.qr_rotated` (stores token suffixes only, not full tokens).

STAFF can view the token for counter use but cannot rotate it.

---

## Export reports

**Who:** OWNER / MANAGER  
**Where:** Admin → **Reports**

See [OWNER_BACKUP_EXPORT.md](./OWNER_BACKUP_EXPORT.md) for filters, Excel/PDF, print, and weekly backup cadence.

Exports are rate-limited (~10 / 15 min / account). Activity: `report.exported`.

---

## Disable / re-enable accounts

**Who:** OWNER or MANAGER (MANAGER cannot disable OWNER/MANAGER)  
**Where:** Admin → **Accounts**  
**Callable:** `disableAccount`

1. Find the staff or customer user.
2. Disable → Auth login blocked + Firestore `status: disabled`.
3. Re-enable the same way when appropriate.
4. You cannot disable your own account or an OWNER account via this path.

For compromised OWNER email: use Firebase Console Auth recovery + Google account security; engineering assist if needed.

---

## Incident basics

| Symptom | First check | Action |
|---------|-------------|--------|
| Customer OTP fails | Auth Phone enabled? Blaze? Authorized domain? Carrier | Firebase Console Auth → Phone; test number; check SMS quota |
| Staff cannot stamp | Role claim? Customer disabled? Functions errors | Accounts role; Activity logs; Functions logs |
| Double stamp fear | Idempotency | Same `idempotencyKey` returns `deduped: true` — do not invent a second stamp |
| Reward not resetting | Flow order | Reset only on **Redeem** after **Approve** — request/approve never clear stamps |
| Admin blank / config banner | Missing `VITE_FIREBASE_*` | Rebuild Hosting with correct public env |
| Spike of Functions errors | Deploy / App Check / secret | See [MONITORING_ALERTS.md](./MONITORING_ALERTS.md); roll back Hosting channel if needed |
| Suspected QR abuse | Lookup + activity | **Rotate QR**; review `customer.lookup` / purchase logs |
| Data loss fear | Exports + PITR | Weekly Excel; Console Firestore export / PITR if enabled |

**Escalation:** Shop floor → OWNER (Ibraheem) → engineering with Functions error samples + approximate time UTC. Never paste service-account keys into chat.

---

## Quick command reference (deployed project only)

```bash
# After Ibraheem links the real project — never hloe-45d43
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes
firebase functions:secrets:set BOOTSTRAP_OWNER_SECRET   # one-shot; delete after bootstrap
```
