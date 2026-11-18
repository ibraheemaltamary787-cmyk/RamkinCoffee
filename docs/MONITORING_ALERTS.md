# Monitoring & alerts — RAMKIN Coffee

Recommendations for the first production week. Prefer Google Cloud Monitoring on the **RAMKIN** Firebase/GCP project only — never configure alerts against `hloe-45d43`.

---

## 1. What to watch

| Signal | Why | Suggested urgency |
|--------|-----|-------------------|
| Cloud Functions error rate | Stamps / rewards / exports fail at the counter | Page OWNER if sustained > ~2% or any burst of `permission-denied` spikes after a deploy |
| Callable latency (p95) | Slow counter UX | Investigate if p95 > 3–5s for `recordPurchase` / lookups |
| Auth sign-in failures / SMS | OTP abuse or misconfig | Spike vs baseline → check Phone Auth quota + App Check |
| App Check rejected tokens | Bots or missing site key after enforce | Soft-fail window before enforce; then alert on rejection climb |
| Firestore read/write spikes | Scraper or buggy client loop | Correlate with Hosting traffic |
| Billing / SMS spend | OTP cost shock | Daily budget alert on Blaze |

---

## 2. Console steps (no code required)

### Functions errors

1. Google Cloud Console → select the **RAMKIN** project.
2. **Logging → Logs Explorer** filter example:

   ```text
   resource.type="cloud_function"
   severity>=ERROR
   ```

   Or for 2nd gen:

   ```text
   resource.type="cloud_run_revision"
   severity>=ERROR
   ```

3. **Logging → Log-based alert** → create alert on that query.
4. Notification channel: OWNER email + optional SMS.

### Auth / Identity spikes

1. Firebase Console → **Authentication → Usage**.
2. Cloud Logging filter for Identity Toolkit errors:

   ```text
   resource.type="identitytoolkit.googleapis.com/Project"
   severity>=ERROR
   ```

3. Optional: chart `identitytoolkit.googleapis.com/api/request_count` in Monitoring → Alerting when rate exceeds a quiet-hour baseline (tune after week 1).

### Budget (SMS + Functions)

1. Google Cloud → **Billing → Budgets & alerts**.
2. Create a monthly budget for the RAMKIN billing account.
3. Alert at 50% / 90% / 100%.

---

## 3. snipped Monitoring alert (YAML sketch)

Use Cloud Monitoring → Alerting → Create policy → **Code editor** (adjust `project_id`):

```yaml
displayName: RAMKIN Functions errors
conditions:
  - displayName: Cloud Function error ratio
    conditionThreshold:
      filter: >
        resource.type = "cloud_function"
        AND metric.type = "cloudfunctions.googleapis.com/function/execution_count"
        AND metric.labels.status != "ok"
      comparison: COMPARISON_GT
      thresholdValue: 5
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
notificationChannels: []  # attach OWNER email channel ID in Console
documentation:
  content: >
    Check Firebase Functions logs for recordPurchase / reward / export failures.
    Do not use project hloe-45d43. See docs/OPS_RUNBOOK.md.
```

Create a second policy for **Auth request count** spikes using metric  
`identitytoolkit.googleapis.com/api/request_count` with a threshold calibrated after observing a normal shop day.

---

## 4. App Check + enforcement snippet

After Console enrollment (see launch checklist):

```bash
# Public site key only in Vite .env — then rebuild Hosting
# VITE_FIREBASE_APPCHECK_SITE_KEY=...

# Functions runtime (Firebase Console → Functions → environment / params)
# or:
firebase functions:config:set  # legacy — prefer .env / params in v2

# For v2, set process env on the service / secret-free flag:
# ENFORCE_APP_CHECK=true
firebase deploy --only functions
```

In code, enforcement is gated by `process.env.ENFORCE_APP_CHECK === 'true'` (`functions/src/security/appCheck.ts`). Keep it **false** until Console enforcement is live.

---

## 5. Weekly OWNER glance (15 minutes)

1. Functions error chart — any new patterns?
2. Auth usage — OTP volume vs foot traffic.
3. Download Excel backup ([OWNER_BACKUP_EXPORT.md](./OWNER_BACKUP_EXPORT.md)).
4. Billing — SMS line item sane?
5. Activity logs — unexpected role changes or mass disables?

---

## 6. Out of scope for v1

- PagerDuty / third-party APM (optional later)
- Synthetic uptime probes (nice-to-have: hit Hosting URLs every 5 min)
- Customer push notifications
