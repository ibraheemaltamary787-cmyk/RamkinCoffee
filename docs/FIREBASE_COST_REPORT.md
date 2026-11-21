# Firebase cost report — RAMKIN Coffee (`ramkincoffee`)

**Date:** 2026-11-21 (Console-verified)  
**Project:** `ramkincoffee` · number `392513147835`  
**Hard rule:** No Spark→Blaze upgrade, no payment card, no paid SMS, no paid API enablement, no production Hosting publish without Ibraheem’s explicit approval.  
**Console inspection status:** **Verified signed-in** on agent desktop. Plan shown as **Spark — No-cost ($0/month)**. No Blaze upgrade, no billing card added, no Functions deploy, no production SMS, no Hosting publish in this session.

---

## 1. Service table

| Service | Necessary for RAMKIN? | Available on Spark (free)? | Typical free / Spark limits (order-of-magnitude) | Potential charges if over / on Blaze | Activated / status (Console) |
|---------|----------------------|----------------------------|--------------------------------------------------|--------------------------------------|------------------------------|
| **Authentication — Email/Password** | **Yes** (OWNER / MANAGER / STAFF) | **Yes** | Unlimited email/password users on free tier; no per-login fee | None for email/password itself | **Yes — Enabled** (this session) |
| **Authentication — Phone OTP (production SMS)** | **Yes for production** customer UX | **No** for real SMS (needs Blaze) | Test numbers / Auth emulator: free | Per-SMS fees after Blaze | **No — left disabled** |
| **Authentication — Phone OTP (test / emulator)** | **Yes for free testing** | **Yes** | Console test numbers + local Auth emulator | None if no real SMS | Emulator path in `.env.example`; Phone provider not enabled |
| **Cloud Firestore** | **Yes** | **Yes** | ~50k reads / 20k writes / 20k deletes per day; 1 GiB stored (Spark) | Over-quota blocked on Spark; Blaze = pay per op | **Yes — DB exists** (`nam5`), empty, ready; repo `firestore.rules` not yet CLI-deployed |
| **Cloud Storage** | **Optional for MVP** | **No for this project** — Console: “To use Storage, upgrade your project's pricing plan” | N/A until Blaze | Storage + egress on Blaze | **Not enabled** (Blaze required — stopped) |
| **Firebase Hosting** | **Yes** for production sites | **Yes** (Spark) | Soft storage/transfer limits | Domain registrar separate; over-quota extras | **Get started only** — **not published** |
| **Cloud Functions (v2 callables)** | **Yes** for privileged writes | **No** — Console requires plan upgrade; repo uses `firebase-functions/v2` | Local Functions emulator: free | Invocations / compute on Blaze | **Not deployed** (needs Blaze approval) |
| **Web App (client SDK)** | **Yes** | **Yes** | Free to register | None | **Yes — “RAMKIN Web”** registered; public config in `.env.example` |
| **App Check** | Recommended before heavy traffic | Yes for enrollment | reCAPTCHA free tier typical | Rare excess edge cases | **No** |
| **Custom domain (registrar)** | Optional | N/A | — | Registrar fee | **No purchase** |

---

## 2. Public web config (safe for client / `.env.example`)

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

These are **public client identifiers**, not service-account secrets. Copy into gitignored `apps/*/.env` for local runs.

---

## 3. Current vs possible future charges

### Current (this checkpoint)

| Item | Charge |
|------|--------|
| Spark plan | **$0** |
| Web app registration + Email/Password Auth + existing Firestore | **$0** |
| Storage / Functions / production SMS / Hosting publish | **$0** (not activated / not published) |

**Estimated monthly cost right now:** **$0.00**

### Possible future (only after Ibraheem approval)

| Path | Est. monthly (small café) | Payment method? |
|------|---------------------------|-----------------|
| Stay Spark (Email/Password + Firestore + Hosting static; Functions via emulator only) | **$0** within quotas | **No** |
| Blaze + Functions + Email/Password + Firestore + Hosting | Typically **~$0–5**/mo under free Blaze allowances | **Yes** + budget alerts |
| Blaze + production Phone SMS | Above **+ SMS** (main spend risk) | **Yes** |
| Enable Storage (Blaze-gated here) | Usually low at café scale | **Yes** (Blaze) |

---

## 4. Architecture implication

Live loyalty **requires Cloud Functions v2** (privileged writes). Console + Firebase policy: **Functions need Blaze**. Spark-only production cannot run the approved security model; use **emulators** until Blaze is approved.

**Storage** on this project also shows a Blaze upgrade wall — keep PDF/Excel via Functions responses / local; do not enable Storage without approval.

---

## 5. Checkpoint — stop here for billing items

### Completed

- [x] Phase 1 Console inspect (Spark confirmed)
- [x] Web app **RAMKIN Web** + public firebaseConfig → `.env.example`
- [x] Email/Password Auth enabled
- [x] Firestore verified (`nam5`, empty, ready)
- [x] Storage Blaze wall documented — **not enabled**
- [x] Hosting inspected — **not published**
- [x] Functions inspected — **not deployed**
- [x] Phone SMS — **not enabled**

### Remaining (needs OWNER / CLI / approval)

| Step | Free? | Needs approval? |
|------|-------|-----------------|
| `firebase login` + deploy `firestore:rules` / indexes | Free on Spark | CLI auth |
| Production Hosting publish (customer + admin targets) | Spark OK | Treat as go-live gate |
| Blaze upgrade | Billing | **Yes** |
| Cloud Functions deploy | Needs Blaze | **Yes** |
| Production Phone SMS | Bills | **Yes** |
| Enable Storage | Needs Blaze here | **Yes** |
| Custom domain purchase | External $ | **Yes** |

### Exact actions needing Ibraheem’s approval before agents proceed

1. Upgrade **`ramkincoffee`** to **Blaze** / link billing.  
2. Deploy **Cloud Functions**.  
3. Enable **production Phone OTP SMS**.  
4. Enable **Storage** (Blaze-gated in Console).  
5. **Publish** production Hosting (and buy any custom domain).  
6. Set Google Cloud **budget alerts**.

**Do not proceed on billing-related items without explicit approval.**
