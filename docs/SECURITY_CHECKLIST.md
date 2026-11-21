# Security checklist — Phase 7 verification

**Date:** 2026-11-18  
**Scope:** Static review of `main` + Phase 7 test expansions.  
**Companion:** [`SECURITY_RULES_REVIEW.md`](./SECURITY_RULES_REVIEW.md)

**Legend:** **PASS** = verified in codebase / unit tests · **BLOCKED** = needs live RAMKIN Firebase · **RESIDUAL** = accepted MVP risk

---

## A. Firebase project hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| No `hloe-45d43` as active project | **PASS** | `.firebaserc` → `"default": "ramkincoffee"`; unit test `functions/src/security/config.test.ts` |
| Docs / comments mention hloe only as forbidden | **PASS** | README, `.env.example`, App Check notes |
| No service-account JSON / private keys committed | **PASS** | `.gitignore` + `.env.example` has no private keys |
| Private web secrets not invented in repo | **PASS** | `.env.example` has public IDs for `ramkincoffee`; `apiKey` / `appId` empty (TODO) |

---

## B. Auth & RBAC (Architecture §4.2)

| Check | Result | Evidence |
|-------|--------|----------|
| Role claims set only via Admin SDK / callables | **PASS** | `setRoleClaim`, `bootstrapOwner`, `setStaffRole`, invites — not client-writable |
| CUSTOMER cannot stamp / export / manage staff | **PASS** | `rbac-matrix.test.ts` + `requireStaff` / `canExportReports` |
| STAFF cannot export / view activity / change N | **PASS** | shared gates + `updateLoyaltySettings` → `requireOwner` |
| STAFF approve only when `staffCanApproveRewards` | **PASS** | `canApproveRewards` + approve/reject callables |
| OWNER-only: settings N, grant MANAGER/STAFF | **PASS** | `canUpdateLoyaltySettings`, `canManageStaffRoles` |
| UI gates are UX-only | **PASS** | Admin routes hide links; Functions re-check claims |
| Live token forge / cross-role callable E2E | **BLOCKED** | Needs Auth Emulator or staging Phone/Email Auth |

---

## C. Firestore rules

| Check | Result | Evidence |
|-------|--------|----------|
| Deny client writes on purchases / rewards / settings / roles | **PASS** | `firestore.rules` — `allow create, update, delete: if false` |
| `rateLimits` fully denied | **PASS** | Explicit match + config test |
| Customers read only own loyalty docs; staff read for counter | **PASS** | `customerId == uid() \|\| isStaff()` |
| Activity logs / invites manager+ read | **PASS** | `isManagerOrOwner()` |
| Rules emulator penetration suite | **BLOCKED** | Needs Firestore Emulator + deployed rules against staging |

---

## D. Loyalty integrity

| Check | Result | Evidence |
|-------|--------|----------|
| Reset **only** on redeem | **PASS** | State machine + `loyalty.test.ts` / `engine.test.ts` |
| Request / approve preserve `purchaseCount` | **PASS** | `simulateFullLoyaltyCycle` |
| Duplicate open reward blocked | **PASS** | `duplicate_open_reward` |
| Idempotent `recordPurchase` key | **PASS** | Doc id = idempotencyKey; schema min 8 |
| Concurrent double-stamp after complete rejected | **PASS** | Unit (transaction E2E **BLOCKED**) |
| Reject → re-request path | **PASS** | Expanded Phase 7 tests |
| N change snapshots on **new** combo only | **PASS** | Redeem uses `nextRequiredPurchases` |

---

## E. Hardening (Phase 6 leftovers)

| Check | Result | Evidence |
|-------|--------|----------|
| App Check soft until Console + `ENFORCE_APP_CHECK` | **PASS** / **BLOCKED** live | Stub + `appCheck.test.ts`; Console enrollment pending |
| QR lookup + export rate limits | **PASS** code / **BLOCKED** live | `enforceRateLimit` wired; needs staging load |
| Export OWNER/MANAGER only | **PASS** | `canExportReports` + `exportReport` |
| Export row limits ≤ 2000 | **PASS** | `exportReportSchema` |

---

## F. Residual risks (accepted for MVP)

1. **STAFF can list customers / purchases** — required for counter; mitigate with hire trust, App Check, activity logs.  
2. **App Check not enforced** until Ibraheem enrolls apps in a real Firebase project.  
3. **Phone OTP abuse / cost** — needs Blaze + App Check + test numbers; unverified without project.  
4. **No live Hosting channel** — staging deploy blocked without Firebase.  
5. **Seed / bootstrap scripts** use ADC — operator must never point at Hloe.

---

## G. What cannot be verified until live deploy on `ramkincoffee`

Documented for UAT blockers (Ibraheem):

1. Project **`ramkincoffee`** is linked in repo — never use `hloe-45d43`.  
2. Enable Phone Auth + Email/Password; Blaze if SMS required.  
3. Provide web **`apiKey`** + **`appId`** (confirm `storageBucket`); fill local `.env`.  
4. Deploy `firestore.rules`, indexes, Functions; set `BOOTSTRAP_OWNER_SECRET`.  
5. Hosting (or Hosting preview channel) for customer + admin.  
6. OTP delivery in target country / test numbers.  
7. Optional: App Check Console → then `ENFORCE_APP_CHECK=true`.  
8. Run penetration checklist in `SECURITY_RULES_REVIEW.md` against staging.  
9. Run `npx tsx scripts/seed-loyalty-demo.local.ts` (without `--dry-run`) against staging ADC.

Until then: automated unit/RBAC/state-machine tests + static rules review are the security bar for Phase 7.
