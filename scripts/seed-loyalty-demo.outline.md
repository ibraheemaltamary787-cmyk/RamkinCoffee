# Seed / demo script outline — loyalty state machine (Phase 4)

Use this against a **staging** RAMKIN Firebase project only. Never point at `hloe-45d43`.

## Prerequisites

1. Phase 3+ Functions deployed (`ensureCustomerProfile`, loyalty callables).
2. OWNER bootstrapped; at least one STAFF (or use OWNER at the counter).
3. Phone Auth test numbers **or** Auth Emulator with a fake customer phone.
4. Admin SDK credentials via Application Default Credentials / gitignored service account (never commit).

## Goal fixture

Create one demo customer and walk the full combo cycle so UAT can see:

| Step | Actor    | Callable / action                                  | Expected combo status                                                                 |
| ---- | -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 0    | System   | `ensureCustomerProfile`                            | `active`, `purchaseCount=0`, `settings.purchasesRequired` snapshotted (default **9**) |
| 1…N  | Staff    | `recordPurchase` × N with unique `idempotencyKey`s | After N: `completed`                                                                  |
| N+1  | Customer | `requestReward`                                    | `reward_pending` — **stamps unchanged**                                               |
| N+2  | Manager  | `approveReward`                                    | `reward_approved` — **stamps unchanged**                                              |
| N+3  | Staff    | `redeemReward`                                     | Old combo `redeemed`; **new** combo `active` @ 0                                      |

Also demo: reject path (request → `rejectReward` with reason → combo back to `completed` → re-request).

## Suggested local script (future `scripts/seed-loyalty-demo.local.ts`)

```ts
// Pseudocode — implement when staging project exists.
// npx tsx scripts/seed-loyalty-demo.local.ts --phone +15550109999 --n 3

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// 1. ensure settings/loyalty { purchasesRequired: 9, staffCanApproveRewards: false }
// 2. createOrGet Auth user with phone; set claim CUSTOMER
// 3. write users/{uid} + customers/{uid} + first combos/{id} (mirror ensureCustomerProfile)
// 4. for i in 1..N: create purchases/{idempotencyKey}, increment combo
// 5. optionally create rewardRequests in requested|approved states for queue demos
// 6. print: customerId, phone, qrToken, comboId, how to open admin Counter
```

## Manual demo without a seed script

1. Customer app: register OTP → dashboard shows **0 / 9** gold progress.
2. Admin Counter: lookup phone → **Record purchase** nine times (or temporarily set N=2 in Settings for a short demo).
3. Customer: **Request reward** — progress text becomes pending; count still 9/9.
4. Admin Rewards or Counter: **Approve** — still 9/9.
5. Admin: **Confirm redeem** — customer dashboard resets to 0 / 9 on a new combo.
6. Firestore: old `purchases` still queryable by previous `comboId`.

## Idempotency / concurrency check

- Submit `recordPurchase` twice with the **same** `idempotencyKey` → second returns `deduped: true`, count unchanged.
- Two different keys in parallel on an almost-complete combo → transaction ensures only valid stamps land; completed combo rejects further stamps.

## Cleanup

Delete demo Auth users and related `customers` / `combos` / `purchases` / `rewardRequests` docs in staging, or use a disposable Firebase project.
