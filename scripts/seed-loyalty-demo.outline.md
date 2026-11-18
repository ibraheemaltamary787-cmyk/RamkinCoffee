# Seed / demo script — loyalty state machine (Phase 7)

Use against a **staging** RAMKIN Firebase project only. Never point at `hloe-45d43`. Never commit service-account JSON.

## Implementation

Runnable script: [`seed-loyalty-demo.local.ts`](./seed-loyalty-demo.local.ts)

```bash
# No Firebase required — prints the plan
npx tsx scripts/seed-loyalty-demo.local.ts --dry-run

# Staging (ADC / GOOGLE_APPLICATION_CREDENTIALS → RAMKIN project)
npx tsx scripts/seed-loyalty-demo.local.ts --phone +15550109999 --n 3 --stop-at approved
npx tsx scripts/seed-loyalty-demo.local.ts --phone +15550109999 --n 2 --stop-at redeemed --name "Demo Guest"
```

| Flag | Default | Meaning |
|------|---------|---------|
| `--dry-run` | off | Print plan only; zero writes |
| `--phone` | `+15550109999` | E.164 demo customer |
| `--n` | `3` | Stamps / `requiredPurchases` for this combo (short demos) |
| `--stop-at` | `approved` | `purchases` \| `requested` \| `approved` \| `redeemed` |
| `--name` | `Demo Guest` | Display name |

The script refuses `projectId === hloe-45d43`.

## Prerequisites (non-dry-run)

1. Phase 3+ Functions/rules available in the **same** project (or Admin SDK writes that mirror callables for demo data).  
2. OWNER bootstrapped separately (`bootstrap-owner.local.ts` / `/bootstrap`).  
3. Phone Auth test number **or** Auth user creatable by phone via Admin SDK.  
4. Application Default Credentials for the RAMKIN project only.

## Goal fixture

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 0 | Script | users + customers + combo | `active`, count 0, QR token |
| 1…N | Script | purchases + increments | After N: `completed` |
| N+1 | Script optional | reward request | `reward_pending`, stamps unchanged |
| N+2 | Script optional | approve | `reward_approved`, stamps unchanged |
| N+3 | Script optional | redeem | Old `redeemed`; new `active` @ 0 |

Also exercise manually: reject path via admin UI (request → reject → re-request).

## Manual demo without seed

1. Customer: register OTP → **0 / 9** (or lower N in Settings for new combos).  
2. Counter: phone/QR → Record purchase × N.  
3. Customer: Request reward — still N/N.  
4. Approve — still N/N; Reject returns to completed.  
5. Redeem — dashboard **0 / N**; history kept.  
6. Same `idempotencyKey` twice → `deduped: true`.

## Cleanup

Delete demo Auth users and related Firestore docs in staging, or use a disposable RAMKIN project (never Hloe).
