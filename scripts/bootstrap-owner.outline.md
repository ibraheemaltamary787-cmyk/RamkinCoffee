# OWNER bootstrap outline (Phase 3)

This is documentation only — no executable bootstrap ships in Phase 2.

## Intended flow

1. Create Auth user for Ibraheem (email/password) in the **RAMKIN** Firebase project.
2. Using Admin SDK (Cloud Function or local script with service account **not** committed):
   - `auth.setCustomUserClaims(uid, { role: 'OWNER' })`
   - Upsert `users/{uid}` with role OWNER
   - Write `activityLogs` entry `role.bootstrap_owner`
3. Force token refresh on next login.
4. Remove or lock the bootstrap entrypoint.

## Guardrails

- Reject if any `OWNER` already exists (unless emergency break-glass with dual control).
- Never accept `role` from the client.
- Never reuse Hloe credentials or project `hloe-45d43`.
