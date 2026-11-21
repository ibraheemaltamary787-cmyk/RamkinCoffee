# Phase 7 — What cannot be verified without live Firebase

Phase 7 delivers automated tests, security checklist results, UAT + staff docs, and a dry-runnable seed script. Project ID **`ramkincoffee`** is wired in the repo; the following remain **blocked** until Console web keys (`apiKey`, `appId`), Auth providers, and authenticated CLI deploy are complete. See [`FIREBASE_COST_REPORT.md`](./FIREBASE_COST_REPORT.md) — **Cloud Functions v2 require Blaze**; production Phone SMS bills; Spark-only path is Email/Password + emulators + Hosting prep without Functions deploy.

**Never** create or reuse `hloe-45d43`. Do not invent API keys, app IDs, or other secrets in the repo.

| Capability | Why blocked | Unblocks when |
|------------|-------------|----------------|
| Phone OTP register/login | Needs Auth Phone (+ usually Blaze SMS) | Project + provider + test/real numbers |
| Staff email/password against cloud | Needs Auth Email/Password + user docs | Project + bootstrap OWNER |
| Callable E2E (stamp / reward / export) | Needs deployed Functions + Admin SDK | `firebase deploy` + secrets |
| Firestore rules penetration | Needs Emulator or staging rules deploy | Emulator suite or staging |
| App Check enforcement | Console enrollment + site key | OWNER completes Console steps |
| Staging Hosting channel | Needs Hosting in Firebase project | `firebase hosting:channel:deploy` |
| OTP country delivery | Carrier / Firebase SMS region | Live send to target country |
| Seed without `--dry-run` | Needs ADC to RAMKIN project | Gitignored SA + correct project |
| UAT sign-off on real shop flow | Depends on all of the above | Staging URLs + staff accounts |

**Safe now (no secrets required):**

- `npm test` / CI — loyalty state machine, RBAC matrix, App Check soft/enforce, config hygiene  
- `npx tsx scripts/seed-loyalty-demo.local.ts --dry-run`  
- Follow [`UAT_SCRIPT.md`](./UAT_SCRIPT.md) and [`STAFF_TRAINING.md`](./STAFF_TRAINING.md) on paper / emulator  
- Review [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
