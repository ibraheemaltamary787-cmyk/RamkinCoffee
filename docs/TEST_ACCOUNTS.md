# Test accounts (DEV Fake OTP)

Seeded by `npm run seed:dev-accounts` against **Auth + Firestore emulators** only.

**OTP for every account:** `0000`  
These `@ramkin.local` values are **identifiers**, not real email delivery.  
Fake OTP is **development-only** — production builds reject it.

---

## Staff / admin (http://localhost:5174)

| Role    | Identifier             | Phone         | How to sign in                          |
| ------- | ---------------------- | ------------- | --------------------------------------- |
| OWNER   | `owner@ramkin.local`   | `+15550100001` | Identifier + OTP `0000` (Fake OTP form) |
| MANAGER | `manager@ramkin.local` | `+15550100002` | Identifier + OTP `0000`                 |
| STAFF   | `staff1@ramkin.local`  | `+15550100003` | Identifier + OTP `0000`                 |

## Customers (http://localhost:5173)

| Role     | Identifier               | Phone          | How to sign in                |
| -------- | ------------------------ | -------------- | ----------------------------- |
| CUSTOMER | `customer1@ramkin.local` | `+15550101001` | Phone + OTP `0000`            |
| CUSTOMER | `customer2@ramkin.local` | `+15550101002` | Phone + OTP `0000`            |

You can also **register a new customer** with any unused E.164 phone + OTP `0000`.

---

## Role checklist

| Role    | Typical actions                                              |
| ------- | ------------------------------------------------------------ |
| CUSTOMER | Register/login, view combo, history, request reward, profile |
| STAFF    | Counter search by phone, record purchases, redeem (if approved) |
| MANAGER  | Approve approve/reject with reason, customers, exports        |
| OWNER    | All of the above + accounts/roles, loyalty N, activity logs, exports |

---

## Re-seed

Emulator data is wiped when emulators stop:

```powershell
npm run emulators
# new terminal:
npm run seed:dev-accounts
```

Dry-run (print plan only):

```powershell
npm run seed:dev-accounts:dry
```
