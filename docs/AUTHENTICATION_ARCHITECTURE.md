# Authentication architecture (Spark + DEV Fake OTP)

**Firebase project:** `ramkincoffee`  
**Never:** `hloe-45d43`, production SMS on Spark keep-free, Fake OTP in production builds.

---

## Modes

| Mode | When | Customer | Staff |
| ---- | ---- | -------- | ----- |
| **DEV Fake OTP** | `VITE_DEV_FAKE_OTP=true` **and** non-production Vite build; Functions emulator (or `ALLOW_DEV_FAKE_OTP=true`) | Phone + OTP `0000` → custom token | `@ramkin.local` / phone + OTP `0000` → custom token |
| **Email/Password** | Spark Console enabled; emulators or live Auth | `/login/email` · `/register/email` | Email + password (bootstrap OWNER / invites) |
| **Phone OTP (real)** | Auth Emulator codes in terminal, or Console test numbers | `/login/phone` when Fake OTP off | N/A |
| **Production SMS** | Explicit Blaze + Phone provider approval | Not enabled on keep-free Spark | N/A |

---

## DEV Fake OTP flow

```text
Client (DEV only)                Functions emulator                 Auth emulator
─────────────────                ──────────────────                 ─────────────
phone / identifier + 0000
        │
        ▼
httpsCallable('devFakeOtpSignIn')
        │  reject if not emulator / ALLOW_DEV_FAKE_OTP
        │  reject if otp !== '0000'
        │  register: createUser(phone) or already-exists
        │  login: getUserByPhone / getUserByEmail
        ▼
customToken ─────────────────────────────────────────────────────►
        │
signInWithCustomToken
        │
ensureCustomerProfile (customers) / role claims (seeded staff)
```

### Production rejection (defense in depth)

1. **Client:** `isClientDevFakeOtpEnabled` returns false when `import.meta.env.PROD === true`, even if `VITE_DEV_FAKE_OTP=true` leaked into the build.
2. **Server:** `isServerDevFakeOtpAllowed` requires `FUNCTIONS_EMULATOR=true` or `ALLOW_DEV_FAKE_OTP=true` (never set in production).
3. **Ops:** Production Hosting builds must not set `VITE_DEV_FAKE_OTP=true`.

---

## Roles & RBAC

Custom claims `role`: `OWNER` | `MANAGER` | `STAFF` | `CUSTOMER`.

| Capability | CUSTOMER | STAFF | MANAGER | OWNER |
| ---------- | -------- | ----- | ------- | ----- |
| Own profile / progress / history | ✓ | | | |
| Record purchase | | ✓ | ✓ | ✓ |
| Approve / reject reward | | settings | ✓ | ✓ |
| Redeem reward | | ✓ | ✓ | ✓ |
| Export reports | | | ✓ | ✓ |
| Assign MANAGER/STAFF | | | | ✓ |

Customers cannot write purchases or stamp counts from the client (Firestore rules deny; mutations via callables only).

---

## Sessions

- Firebase Auth ID tokens persist across refresh (Auth emulator IndexedDB / local persistence).
- Sign out clears the session (`signOut`).
- After Fake OTP register, `ensureCustomerProfile` creates `users` + `customers` + active combo.

---

## Seed identifiers

See [`TEST_ACCOUNTS.md`](./TEST_ACCOUNTS.md). Seed script: `scripts/seed-dev-accounts.local.ts`.

---

## Related callables

| Callable | Auth | Purpose |
| -------- | ---- | ------- |
| `devFakeOtpSignIn` | none (DEV gated) | OTP `0000` → custom token |
| `ensureCustomerProfile` | signed-in | Create/update customer + combo |
| `recordLogin` | signed-in | Activity log |
| `bootstrapOwner` | signed-in + secret | First OWNER (non-seed path) |
