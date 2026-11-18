# Phase 7 — What cannot be verified without live Firebase

Phase 7 delivers automated tests, security checklist results, UAT + staff docs, and a dry-runnable seed script. The following remain **blocked** until Ibraheem creates a **new** RAMKIN Firebase project.

**Never** create or reuse `hloe-45d43`. Do not invent project ids, API keys, or secrets in the repo.

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
