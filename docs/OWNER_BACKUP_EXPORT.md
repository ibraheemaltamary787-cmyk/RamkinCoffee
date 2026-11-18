# OWNER backup & export runbook

For the business owner (and managers with report access). No Firebase Console required for day-to-day exports.

## What you can export

| Format | Contents | Who |
|--------|----------|-----|
| **Excel (.xlsx)** | Sheets: Summary, Customers, Purchases, Reward Requests — real column headers | OWNER, MANAGER |
| **PDF** | Branded summary (official RAMKIN logo) + filter totals + samples | OWNER, MANAGER |
| **Print** | Browser print of Reports preview or individual customer history | staff+ (customer detail); reports OWNER/MANAGER |

## How to export (admin app)

1. Sign in at the admin app as OWNER or MANAGER.
2. Open **Reports**.
3. Set filters as needed:
   - **From / To** — date range (purchases & rewards by event time; customers by created date)
   - **Search** — customer name or phone digits
   - **Recorded by** — staff Auth UID (purchases)
   - **Reward status** — requested / approved / rejected / redeemed
   - Sheet checkboxes — include/exclude customers, purchases, rewards
4. **Preview** — on-screen summary (also used for **Print preview**).
5. **Download Excel** or **Download PDF**.

Exports are rate-limited (about 10 per 15 minutes per account). Activity log action: `report.exported`.

## Customer history print

1. **Customers** → open a member.
2. Click **Print history**.
3. Use the browser print dialog (PDF printer is fine).

## Periodic backup recommendations

Until automated scheduled backups (Phase 8+):

1. **Weekly Excel export** — leave filters empty (or last 7 days), download all three sheets; store offline (encrypted drive / OWNER cloud folder).
2. **Monthly PDF summary** — keep a dated archive for the accountant / franchise folder.
3. **After major events** — staff roster change, N change, or disputed free drink — export that day’s purchases + rewards.
4. **Do not** email unencrypted exports with full phone lists to shared inboxes.

## Firebase Console backups (OWNER / project admin)

When the RAMKIN Firebase project exists (never `hloe-45d43`):

1. Enable **Firestore PITR / scheduled export** to a dedicated GCS bucket (Blaze).
2. Restrict bucket IAM to OWNER + break-glass SA only.
3. Document the bucket name in a private ops note — not in the public README if sensitive.
4. Auth user recovery: keep OWNER email recovery codes offline.

## What is not a backup

- Screenshots of the overview page
- Client `.env` files (public web keys only; not data)
- Reusing another product’s Firebase project

## Related

- [SECURITY_RULES_REVIEW.md](./SECURITY_RULES_REVIEW.md) — rules + pen-test checklist
- Admin route: `/app/reports`
- Callable: `exportReport`
