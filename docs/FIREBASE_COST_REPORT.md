# Firebase cost report — RAMKIN Coffee (`ramkincoffee`)

**Date:** 2026-11-21 (docs research + prior Console checkpoint)  
**Project:** `ramkincoffee` · number `392513147835`  
**Plan (Console):** **Spark — No-cost ($0/month)** — OWNER chose **keep-free**; never upgrade to Blaze without explicit approval.  
**Hard rule:** No Spark→Blaze upgrade, no payment card, no paid SMS, no paid API enablement, no production Hosting publish without Ibraheem’s explicit approval.  
**Sources:** [Firebase Pricing](https://firebase.google.com/pricing), [Storage billing FAQ (Sept 2024)](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [Auth FAQ — SMS / Spark](https://firebase.google.com/docs/auth/faq-and-troubleshooting), [Auth limits](https://firebase.google.com/docs/auth/limits), [Phone auth (web) — test numbers](https://firebase.google.com/docs/auth/web/phone-auth), [Identity Platform SMS rates](https://cloud.google.com/identity-platform/pricing), [Functions FAQ](https://firebase.google.com/docs/functions/faq-and-troubleshooting), [Functions local emulator](https://firebase.google.com/docs/functions/local-emulator), [Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth).  
**Emulator / test-phone how-to:** [`docs/FIREBASE_EMULATOR_DEV.md`](./FIREBASE_EMULATOR_DEV.md)

---

## 1. Focus table (Storage · Phone · Functions · Firestore)

| Service | Spark support | Blaze required? | Free allowance | Estimated cost | Recommendation |
|---------|---------------|-----------------|----------------|----------------|----------------|
| **Cloud Storage** | **No** (Spark = “Not applicable”; Console upgrade wall on `ramkincoffee`) | **Yes** to provision/use buckets (policy since Sept 2024). Blaze still has no-cost quotas. | On Blaze only: new `*.firebasestorage.app` buckets in `us-central1` / `us-east1` / `us-west1` — **5 GB-months** stored, **100 GB/mo** download, **5K** uploads/mo, **50K** downloads/mo ([pricing](https://firebase.google.com/pricing)). Legacy `*.appspot.com`: 5 GB / 1 GB/day download / 20K uploads/day / 50K downloads/day. | Café logo + a few menu images ≪ free Blaze tier → effectively **~$0** *if* Blaze were approved. Overage (new buckets): GCS rates after free tier. | **Do not enable.** Serve brand/menu images from **Vite `public/`** and/or **Firebase Hosting** (Spark). PDF/Excel already stream from Functions responses — no Storage needed for MVP. |
| **Phone sign-in** | Email/Password **yes**. Production SMS **no** (“Not applicable” on Spark; billing account required since Sept 2024). | **Yes** for real carrier SMS. | **Test paths (free, no SMS):** Console **Phone numbers for testing** (up to 10 fictional numbers + fixed codes) and/or **Auth Emulator** (codes printed to terminal; no carrier). Production: first **10 SMS/day** not billed on Identity Platform rate card; then per-SMS. | **Jordan (JO / +962):** **$0.24 per SMS sent** per [Identity Platform pricing](https://cloud.google.com/identity-platform/pricing) (rates change — re-check before go-live). Example: ~200 billed JO OTPs/mo ≈ **~$48** (plus any retries/abuse). JO is listed as a supported phone-auth region in the [Auth FAQ](https://firebase.google.com/docs/auth/faq-and-troubleshooting). | **Keep Phone provider disabled** for production SMS. Develop with Auth Emulator + (optional) Console test numbers. Prefer staff Email/Password; defer customer phone OTP until OWNER approves Blaze + SMS budget + region allow-list (**JO only**). |
| **Cloud Functions** | **No** deploy (“Not applicable” on Spark). | **Yes** to deploy (v1/v2). Emulator works on any plan. | Blaze no-cost (monthly): **2M** invocations, **400K** GB-sec, **200K** CPU-sec, **5 GB** egress; Cloud Build **120 min/day**; Artifact Registry **500 MB** ([pricing](https://firebase.google.com/pricing) / [Functions FAQ](https://firebase.google.com/docs/functions/faq-and-troubleshooting)). Small deploy storage charges can still appear. | Small café under free invocation/compute → typically **~$0–few dollars**/mo (watch build artifact storage). Local emulator: **$0**. | **Do not deploy** without Blaze approval. Use **Functions Emulator** for purchases, reward approve/reject/redeem, combo reset, idempotency, activity logs. **Never move privileged logic to the browser** — clients stay read-mostly; callables remain authoritative. |
| **Cloud Firestore** | **Yes** | **No** (Blaze only if you need pay-as-you-go past Spark caps) | Spark & Blaze no-cost band: **1 GiB** stored, **10 GiB/mo** egress, **20K writes/day**, **50K reads/day**, **20K deletes/day** ([pricing](https://firebase.google.com/pricing)). Spark **hard-stops** at quota; Blaze bills overage. | Small café (tens–low hundreds of members, staff stamps) usually **$0** on Spark if queries stay lean. | **Keep on Spark.** Deploy rules/indexes when CLI is available. Avoid chatty client listeners; prefer Functions for privileged writes. |

---

## 2. What works on Spark today (Console-verified)

| Capability | Status |
|------------|--------|
| Spark plan itself | **Active** — $0/month |
| Web app **RAMKIN Web** + public client config | Registered (see §5 / `.env.example`) |
| Auth — **Email/Password** | **Enabled** |
| Auth — Phone (production SMS) | **Disabled** (correct for keep-free) |
| Cloud Firestore (`nam5`) | Exists, empty, ready |
| Firebase Hosting | Inspected only — **not published** |
| Cloud Storage | **Not enabled** (Blaze wall) |
| Cloud Functions | **Not deployed** (Blaze required) |

**Current monthly spend:** **$0.00**

---

## 3. What needs Blaze (OWNER approval)

1. **Deploy Cloud Functions** (required for live loyalty security model).  
2. **Production Phone OTP SMS** (carrier messages; billed per SMS).  
3. **Enable Cloud Storage** buckets.  
4. Anything that links a **Cloud Billing** account / payment method / budget spend beyond Spark hard caps.

Until then: **emulators + Email/Password + Firestore (+ optional Hosting static)** only.

---

## 4. Free testing paths (no Blaze, no carrier SMS)

See full steps in [`FIREBASE_EMULATOR_DEV.md`](./FIREBASE_EMULATOR_DEV.md).

| Path | SMS cost | Notes |
|------|----------|-------|
| **Auth + Functions + Firestore emulators** | $0 | `firebase emulators:start --only auth,functions,firestore` + `VITE_USE_FIREBASE_EMULATORS=true`. Phone codes print to the emulator terminal ([Auth emulator docs](https://firebase.google.com/docs/emulator-suite/connect_auth)). |
| **Console fictional test phone numbers** | $0 | Auth → Sign-in method → Phone → **Phone numbers for testing** (≤10). No real SMS ([phone auth docs](https://firebase.google.com/docs/auth/web/phone-auth)). Enabling the Phone *provider* for test numbers still must not turn on production SMS regions without approval. Prefer emulator-first while keep-free. |
| **Email/Password staff flows** | $0 | Already enabled on Spark. |
| **Unit tests / dry-run seeds** | $0 | `npm test`, `scripts/seed-loyalty-demo.local.ts --dry-run`. |

---

## 5. Cheapest production architecture (keep-free vs minimal Blaze)

### A. Stay Spark (OWNER keep-free) — **$0**

- Staff: Email/Password.  
- Data: Firestore within daily quotas.  
- Static sites: Hosting (when publish approved) — logo/assets from build `public/` (no Storage).  
- Loyalty engine: **Functions Emulator only** (not a public production backend).  
- **Gap:** cannot run the approved privileged callables in production without Blaze.

### B. Cheapest *live* loyalty (needs OWNER Blaze approval) — typically **~$0–5/mo** if careful

- Blaze + **Functions** + Email/Password + Firestore + Hosting.  
- **Defer** production Phone SMS (or use staff-assisted enrollment).  
- **Skip Storage** — Hosting/`public` for café images.  
- Set **budget alerts** immediately; allow SMS region **JO only** if phone is later enabled.  
- Expect small Cloud Build / Artifact Registry pennies on deploy even inside “free” Functions invocation tier ([Functions FAQ](https://firebase.google.com/docs/functions/faq-and-troubleshooting)).

### C. Blaze + Jordan production Phone SMS — **highest spend risk**

- JO ≈ **$0.24/SMS** after first 10 SMS/day free ([Identity Platform pricing](https://cloud.google.com/identity-platform/pricing)).  
- Abusive traffic / retries can dominate the bill — use SMS region policy + App Check.

**Rough small-café monthly estimate**

| Scenario | Rough $/mo |
|----------|------------|
| Spark keep-free (current) | **$0** |
| Blaze + Functions + Hosting + Firestore; no Storage; no SMS | **~$0–5** (mostly free-tier; watch deploy artifacts) |
| Above + light JO OTP (e.g. ~50–200 billed SMS) | **+$12–$48** SMS (order-of-magnitude) |

---

## 6. Free / Spark-safe alternatives to Cloud Storage

| Approach | Paid account? | Fit for RAMKIN |
|----------|---------------|----------------|
| `apps/*/public/` and `functions/assets/brand/` (already used for logo) | No | **Preferred** for café image assets |
| Firebase Hosting static files (Spark: 10 GB storage, 360 MB/day transfer) | No (Hosting on Spark) | Production CDN for built assets |
| Third-party “free” object hosts | Often require card / can change ToS | **Avoid** unless OWNER explicitly accepts a named free tier |
| Cloud Storage on Blaze | Requires Blaze | Only if OWNER approves and free GCS tier is enough |

---

## 7. Public web config (safe for client / `.env.example`)

Registered Console web app **RAMKIN Web** (`1:392513147835:web:1d4888856b3c48e2582a9e`):

| Key | Value |
|-----|--------|
| `apiKey` | `AIzaSyDnowBTQmlqnWcV7tf7yUebVmvXAft8M5A` |
| `authDomain` | `ramkincoffee.firebaseapp.com` |
| `projectId` | `ramkincoffee` |
| `storageBucket` | `ramkincoffee.firebasestorage.app` |
| `messagingSenderId` | `392513147835` |
| `appId` | `1:392513147835:web:1d4888856b3c48e2582a9e` |
| `measurementId` (optional) | `G-0JH19WWFGQ` |

These are **public client identifiers**, not service-account secrets. Never reuse project `hloe-45d43`.

---

## 8. Architecture reminder — privileged logic stays in Functions

Live loyalty **requires Cloud Functions** for: `recordPurchase`, reward approve/reject/redeem, combo reset on redeem, idempotency keys, activity logs, exports, role bootstrap.

- **Spark:** implement and test via **Functions Emulator** only.  
- **Browser:** must not gain write power for those collections (Firestore rules deny client privileged writes).  
- **Do not** “temporarily” move purchase/reward mutations into client SDK writes to avoid Blaze.

---

## 9. Checkpoint — items needing OWNER approval

| Action | Free on Spark? | Needs OWNER approval? |
|--------|----------------|----------------------|
| `firebase login` + deploy `firestore:rules` / indexes | Yes | CLI auth (not billing) |
| Production Hosting publish | Yes (Spark Hosting) | Treat as go-live gate |
| Upgrade to **Blaze** / link billing | No | **Yes** |
| Deploy **Cloud Functions** | No | **Yes** (implies Blaze) |
| Enable **production Phone OTP SMS** | No | **Yes** |
| Enable **Storage** | No | **Yes** |
| Custom domain purchase | N/A (registrar) | **Yes** |
| Google Cloud **budget alerts** | After Blaze | **Yes** (recommended with Blaze) |

**Do not proceed on billing-related items without explicit approval.**
