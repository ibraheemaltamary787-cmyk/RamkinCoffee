# UAT script — RAMKIN Coffee (Phase 7)

**Audience:** Ibraheem + shop staff  
**Goal:** Prove register → stamp → request → approve → redeem → report without developer help.  
**Prerequisite:** Staging Firebase + Hosting + Phone Auth (see blockers at bottom). Until then, run what you can against Auth/Firestore Emulators or mark steps **BLOCKED**.

Print or copy this checklist. Mark **Pass / Fail / Blocked** and note defects.

---

## 0. Prep (OWNER / Ibraheem)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 0.1 | Confirm Firebase project is **RAMKIN**, not `hloe-45d43` | Project id ≠ hloe | |
| 0.2 | Customer + admin URLs open (Hosting or local with real `.env`) | Apps load with brand | |
| 0.3 | OWNER bootstrapped; one MANAGER and one STAFF exist | Can sign in admin | |
| 0.4 | Optional: `npx tsx scripts/seed-loyalty-demo.local.ts --dry-run` then seed with `--n 2 --stop-at purchases` | Fixture customer printed | |
| 0.5 | For a short demo, OWNER Settings → set N=2 (applies to **new** combos) | Saved | |

---

## 1. Customer register + login

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.1 | Open customer site → Register | Brand-first landing; register form | |
| 1.2 | Enter phone → receive OTP → verify | Dashboard, progress **0 / N** | |
| 1.3 | Open Profile; set display name | Name updates; cannot change role | |
| 1.4 | Note phone + on-screen **QR** | QR visible for counter | |
| 1.5 | Log out → Login with OTP | Returns to same progress | |

---

## 2. Staff stamp (Counter)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 2.1 | STAFF signs in admin → **Counter** | Counter UI | |
| 2.2 | Lookup by **phone** | Customer card: stamps remaining | |
| 2.3 | Lookup by **QR** (paste token or camera) | Same customer | |
| 2.4 | **Record purchase** × N | After N: eligible / completed | |
| 2.5 | Record once more | Error / blocked (combo not active) | |
| 2.6 | Double-submit same action quickly | No double count (idempotency) | |
| 2.7 | Customer refreshes dashboard | Shows N / N, reward ready | |

---

## 3. Request reward (customer)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 3.1 | Customer taps **Request reward** | Status pending; **stamps still N / N** | |
| 3.2 | Request again | Blocked (duplicate open request) | |

---

## 4. Approve / reject (manager)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 4.1 | MANAGER → **Rewards** queue | Open request visible | |
| 4.2 | **Reject** with reason (≥3 chars) | Combo back to completed; stamps still N | |
| 4.3 | Customer **Request** again | New pending request | |
| 4.4 | MANAGER **Approve** | Approved; stamps still N (**not** reset) | |
| 4.5 | STAFF tries Approve when setting off | Denied (unless OWNER enabled staff approve) | |

---

## 5. Redeem (staff)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 5.1 | Hand free drink at counter | Physical drink given | |
| 5.2 | STAFF **Confirm redeem** | Success | |
| 5.3 | Customer dashboard | **0 / N** on a **new** combo | |
| 5.4 | Admin → Customer detail | Old purchases + redeemed request still listed | |

---

## 6. Report (owner/manager)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 6.1 | OWNER/MANAGER → **Reports** | Filters load | |
| 6.2 | Export **Excel** | Downloads; real column headers | |
| 6.3 | Export **PDF** | Summary with official logo | |
| 6.4 | STAFF opens Reports / export | Denied or hidden + server deny | |
| 6.5 | Activity logs show purchase / reward / export | Entries present | |

---

## 7. Negative / security smoke (OWNER)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 7.1 | Customer account cannot open admin stamp UI meaningfully | No staff powers | |
| 7.2 | Disabled customer cannot be stamped | Failed precondition | |
| 7.3 | Confirm project id still not `hloe-45d43` | Pass | |

---

## Sign-off

| Role | Name | Date | P0/P1 open? | Sign |
|------|------|------|-------------|------|
| OWNER | Ibraheem | | | |
| Staff lead | | | | |

**Pass criteria:** Full path 1→6 green; no P0/P1 open; staff can stamp/approve/redeem without a developer.

---

## Blockers for live UAT (no inventing Firebase)

These are **required** before the checklist can be fully executed:

1. **New RAMKIN Firebase project** (Auth Phone + Email/Password, Firestore, Functions, Hosting).  
2. **Never** reuse `hloe-45d43`.  
3. Public web config in local/Hosting env (`VITE_FIREBASE_*`) — not committed.  
4. Deploy rules, indexes, Functions; `BOOTSTRAP_OWNER_SECRET` then rotate.  
5. OTP delivery verified for target country (or Auth test numbers).  
6. Staging Hosting URLs for customer + admin.  
7. Optional App Check before production (Phase 8).

Until then: unit tests + this script (dry-run / emulator) are the Phase 7 bar; **staging Hosting deploy is blocked**.
