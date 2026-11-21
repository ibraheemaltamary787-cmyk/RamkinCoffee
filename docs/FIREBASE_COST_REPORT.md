# Firebase cost report — RAMKIN Coffee (`ramkincoffee`)

**Date:** 2026-11-21  
**Project:** `ramkincoffee` · number `392513147835`  
**Hard rule:** No Spark→Blaze upgrade, no payment card, no paid SMS, no paid API enablement, no production Hosting publish without Ibraheem’s explicit approval.  
**Console inspection status:** **Blocked** — agent desktop hit Google sign-in at Firebase Console. Live plan/billing/web-app values below are **not Console-verified** until Ibraheem signs in via [Try Live](https://cursor.com/agents/bc-3dbd1429-18e6-5ce6-8317-3b9edad89ac4#desktop). Repo wiring from [PR #8](https://github.com/ibraheemaltamary787-cmyk/RamkinCoffee/pull/8) is in place (`.firebaserc` → `ramkincoffee`; public IDs in `.env.example`).

---

## 1. Service table

| Service | Necessary for RAMKIN? | Available on Spark (free)? | Typical free / Spark limits (order-of-magnitude) | Potential charges if over / on Blaze | Activated in this session? |
|---------|----------------------|----------------------------|--------------------------------------------------|--------------------------------------|----------------------------|
| **Authentication — Email/Password** | **Yes** (OWNER / MANAGER / STAFF) | **Yes** | Unlimited email/password users on free tier; no per-login fee | None for email/password itself | **No** — Console login required to enable |
| **Authentication — Phone OTP (production SMS)** | **Yes for production** customer UX (architecture prefers phone) | **No** for real SMS | Test phone numbers / Auth emulator: free, no SMS | Per-SMS fees after Blaze; varies by country | **No** — intentionally not enabled (would bill) |
| **Authentication — Phone OTP (test numbers / emulator)** | **Yes for free testing** | **Yes** | Console test numbers + local Auth emulator | None if no real SMS sent | **No** — Console login required for test numbers; emulator path documented in `.env.example` |
| **Cloud Firestore** | **Yes** (source of truth) | **Yes** | ~50k reads / 20k writes / 20k deletes per day; 1 GiB stored (Spark quotas; confirm in Console) | Over-quota blocked on Spark; on Blaze: pay per read/write/storage | **No** — DB create/verify needs Console; rules file already in repo |
| **Cloud Storage** | **Optional for MVP** (reports/PDF can stream from Functions; no profile photos required) | Partially — product often pushes Storage toward Blaze for new projects | Free quota exists historically; confirm current Console | Storage + egress fees on Blaze | **No** — **not enabling**; keep local/temp / Functions response alternative |
| **Firebase Hosting** | **Yes** for production sites (customer + admin) | **Yes** (Spark Hosting) | Soft limits (e.g. storage + transfer); enough for a small café site | Custom domain is DNS-only (domain purchase is separate, not Firebase); over-quota / Blaze extras | **Config + local build only** — **no production publish** |
| **Cloud Functions (v2 callables)** | **Yes** for privileged writes (purchases, rewards, roles, exports) | **No** — **Blaze required** for deployable Cloud Functions (repo uses `firebase-functions/v2`) | Local **Functions emulator**: free | Invocations, compute time, networking on Blaze; still usually cents–low dollars for a small café if coded carefully | **No deploy** — would require Blaze approval |
| **App Check (reCAPTCHA v3)** | Recommended before heavy traffic | Yes for enrollment | reCAPTCHA free tier for typical café volume | Abuse / excess assessment edge cases rare at café scale | **No** |
| **Secret Manager / Functions secrets** | Needed for `BOOTSTRAP_OWNER_SECRET` with live Functions | Tied to GCP / Blaze Functions path | N/A on Spark-only | Secret versions / API usage with Functions on Blaze | **No** |
| **Analytics / Crashlytics / paid Google Maps / etc.** | Not required for loyalty MVP | Optional | Free Analytics OK if already on | Avoid enabling unrelated paid APIs | **No** — do not enable |
| **Custom domain (registrar)** | Optional UX polish | N/A (not a Firebase plan item) | — | Domain registrar fee (outside Firebase) | **No purchase** |

---

## 2. Current vs possible future charges

### Current (this checkpoint)

| Item | Charge |
|------|--------|
| Repo wiring to `ramkincoffee` | **$0** |
| Console inspection / Auth / Firestore / Storage / Hosting publish / Functions deploy | **$0** (not done; login blocked; no billing actions) |
| Local emulators + unit tests | **$0** |

**Estimated monthly cost right now:** **$0.00** (nothing billable activated).

### Possible future (only after Ibraheem approval)

| Path | Est. monthly (small café: ~50–200 active members, few staff) | Requires payment method? |
|------|---------------------------------------------------------------|--------------------------|
| **Spark-only stall** (Email/Password staff + Firestore + Hosting static; no Functions deploy, no real SMS) | **$0** within free quotas | **No** |
| **Blaze + Functions + Email/Password + Firestore + Hosting** (staff-driven stamps; customers may use email or deferred phone) | Typically **~$0–5**/mo if traffic stays inside free Blaze allowances; watch Functions + Firestore | **Yes** (Blaze links a billing account; set **budget alerts** immediately) |
| **Blaze + production Phone OTP SMS** | Functions/Hosting/Firestore as above **+ SMS** (often the dominant cost; e.g. tens of cents per OTP depending on country) | **Yes** — **highest spend risk** for this product |
| **Storage + App Check + custom domain** | Usually negligible at café scale + one-time domain fee at registrar | Domain: registrar; Storage/App Check: usually free-tier enough |

---

## 3. What is free vs what needs billing approval

### Free / Spark-safe (preferred now)

- Keep project on **Spark** until Ibraheem explicitly approves Blaze.
- Enable **Email/Password** Auth only (staff/OWNER testing).
- Create **Firestore** (production mode + deploy repo `firestore.rules`) — free on Spark.
- Use **Auth emulator + Firestore emulator + Functions emulator** for full loyalty E2E without cloud Functions deploy.
- Prepare Hosting config / `npm run build:apps` locally; **do not** `firebase deploy --only hosting` until approved.
- Phone Auth: **test phone numbers only** or emulator — **never** send production SMS without approval.

### Requires Ibraheem’s explicit approval (billing / Blaze)

1. **Upgrade Spark → Blaze** (payment method on Google Cloud Billing).
2. **Deploy Cloud Functions** (architecture depends on v2 callables — **cannot go live without Blaze**).
3. **Enable production Phone Auth SMS** (per-message charges).
4. **Enable Cloud Storage** if Console requires Blaze for this project.
5. **Purchase a custom domain** (registrar — outside Firebase).
6. **Production Hosting publish** / custom-domain cutover (no Firebase fee for basic Hosting, but treat as go-live gate).
7. Any paid Google API, SMS campaign, or quota increase that can charge.

---

## 4. Architecture implication (important)

RAMKIN’s security model **denies client privileged writes** in `firestore.rules`. Live stamping / rewards **require Cloud Functions**. Those Functions are **v2** (`onCall` from `firebase-functions/v2/https`) and therefore **need Blaze** to deploy.

**Spark-only reality check:** you can host static UIs and use Firestore/Auth email on Spark, but **you cannot run the production loyalty backend** without either:

- upgrading to Blaze and deploying Functions, or  
- staying on **local/staging emulators** (dev only).

There is **no free Spark workaround** that preserves the approved security architecture in production.

---

## 5. Collections expected in Firestore (rules already deny privileged client writes)

| Collection | Client | Server (Functions) |
|------------|--------|--------------------|
| `users` | read self / staff | create/update/delete |
| `customers` | read self / staff | all writes |
| `combos` | read own / staff | all writes |
| `purchases` | read own / staff | all writes |
| `rewardRequests` | read own / staff | all writes |
| `settings` | read signed-in | writes |
| `staffInvites` | read manager+ | writes |
| `activityLogs` | read manager+ | writes |
| `rateLimits` | deny | server only |

`redemptions` are modeled via `rewardRequests` status + combo lifecycle (no separate client-writable collection).

---

## 6. Checkpoint — stop here

### Completed (this agent turn / prior)

- [x] Confirmed repo default project `ramkincoffee` (PR #8 merged).
- [x] Public IDs in `.env.example` (`projectId`, `authDomain`, `messagingSenderId`); `apiKey` / `appId` left empty (not invented).
- [x] Reviewed `firestore.rules` — privileged writes denied to clients.
- [x] Confirmed Hosting targets in `firebase.json` (customer + admin); **no publish**.
- [x] Confirmed Functions are **v2** → Blaze-gated.
- [x] Wrote this cost report (repo + store copy).
- [ ] Console plan / billing / web config / Auth / Firestore live state — **blocked on Google login**.

### Remaining (needs Console login and/or approval)

| Step | Free? | Needs approval? |
|------|-------|-----------------|
| Ibraheem signs into Firebase Console on agent desktop | Free | Access only |
| Retrieve/register Web app → fill `apiKey` / `appId` | Free | No |
| Enable Email/Password | Free | No (Spark) |
| Add Phone **test** numbers only | Free | No |
| Create Firestore + deploy rules (CLI login) | Free | No for Spark DB; CLI auth required |
| Enable production Phone SMS | **Bills** | **Yes** |
| Blaze upgrade + Functions deploy | **Billing account** | **Yes** |
| Storage enable if Blaze-gated | Maybe bills | **Yes if Blaze** |
| Production Hosting deploy | Spark OK | Treat as go-live approval |
| Custom domain purchase | External $ | **Yes** |

### Payment method

- **Not required** to continue Spark-only Console setup (Email/Password, Firestore, Hosting prep, web config).
- **Required** before Blaze, production SMS, or Cloud Functions deploy.

### Exact actions needing Ibraheem’s approval before agents proceed

1. Link a billing account / upgrade **`ramkincoffee`** to **Blaze**.  
2. Deploy **Cloud Functions** to production.  
3. Enable **production Phone OTP SMS** (non-test).  
4. Enable **Storage** if Console demands Blaze.  
5. **Publish** production Hosting (and buy any custom domain).  
6. Confirm any Google Cloud budget / alert email.

**Do not proceed past this checkpoint on billing-related items without explicit approval.**
