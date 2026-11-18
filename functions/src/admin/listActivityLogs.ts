import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Query, type Timestamp } from 'firebase-admin/firestore';
import { canViewActivityLogs, listActivityLogsSchema, type ActivityLogDto } from '@ramkin/shared';
import { requireAuth } from '../auth/claims';
import { toIso } from './time';

export const listActivityLogs = onCall({ cors: true }, async (request) => {
  const actor = requireAuth(request);
  if (!canViewActivityLogs(actor.role)) {
    throw new HttpsError('permission-denied', 'OWNER or MANAGER access required.');
  }

  const input = listActivityLogsSchema.parse(request.data ?? {});
  const db = getFirestore();

  let query: Query = db.collection('activityLogs');
  if (input.actorUid) {
    query = query.where('actorUid', '==', input.actorUid).orderBy('createdAt', 'desc');
  } else if (input.action) {
    query = query.where('action', '==', input.action).orderBy('createdAt', 'desc');
  } else {
    query = query.orderBy('createdAt', 'desc');
  }

  const snap = await query.limit(input.limit).get();
  const logs: ActivityLogDto[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      logId: doc.id,
      actorUid: String(data.actorUid ?? ''),
      actorRole: String(data.actorRole ?? ''),
      action: String(data.action ?? ''),
      entityType: String(data.entityType ?? ''),
      entityId: String(data.entityId ?? ''),
      metadata: (data.metadata as Record<string, unknown> | undefined) ?? {},
      createdAt: toIso(data.createdAt as Timestamp | undefined),
    };
  });

  return { ok: true as const, logs };
});
