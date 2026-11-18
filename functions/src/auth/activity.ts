import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { ActivityAction, Role } from '@ramkin/shared';

export interface ActivityLogInput {
  actorUid: string;
  actorRole: Role | string | null;
  action: ActivityAction | string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function writeActivityLog(input: ActivityLogInput): Promise<string> {
  const ref = getFirestore().collection('activityLogs').doc();
  await ref.set({
    actorUid: input.actorUid,
    actorRole: input.actorRole ?? 'unknown',
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
