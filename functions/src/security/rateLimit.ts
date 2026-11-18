/**
 * Basic per-uid rate limiting via Firestore.
 *
 * Production note: for high traffic, prefer Redis / Memorystore or Cloud Armor.
 * This collection must stay client-denied (see firestore.rules).
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export interface RateLimitOptions {
  /** Unique action key, e.g. `exportReport` or `lookupCustomerByQr`. */
  action: string;
  uid: string;
  /** Max calls allowed inside the window. */
  maxCalls: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Throws `resource-exhausted` when the caller exceeds `maxCalls` in `windowMs`.
 * Best-effort: if the rateLimit doc write fails after a race, still allow once.
 */
export async function enforceRateLimit(options: RateLimitOptions): Promise<void> {
  const { action, uid, maxCalls, windowMs } = options;
  const db = getFirestore();
  const docId = `${uid}_${action}`;
  const ref = db.collection('rateLimits').doc(docId);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const windowStartMs =
      data?.windowStart instanceof Timestamp
        ? data.windowStart.toMillis()
        : typeof data?.windowStartMs === 'number'
          ? data.windowStartMs
          : 0;
    const count = typeof data?.count === 'number' ? data.count : 0;

    if (windowStartMs && now - windowStartMs < windowMs) {
      if (count >= maxCalls) {
        throw new HttpsError(
          'resource-exhausted',
          `Too many ${action} requests. Try again in a few minutes.`,
        );
      }
      tx.set(
        ref,
        {
          uid,
          action,
          count: count + 1,
          windowStart: Timestamp.fromMillis(windowStartMs),
          windowStartMs,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    tx.set(ref, {
      uid,
      action,
      count: 1,
      windowStart: Timestamp.fromMillis(now),
      windowStartMs: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
