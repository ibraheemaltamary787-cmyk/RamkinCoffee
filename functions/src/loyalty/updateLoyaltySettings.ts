import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  canUpdateLoyaltySettings,
  updateLoyaltySettingsSchema,
} from '@ramkin/shared';
import { requireOwner } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { LOYALTY_SETTINGS_PATH, ensureLoyaltySettingsDoc } from './settings';

export const updateLoyaltySettings = onCall({ cors: true }, async (request) => {
  const owner = requireOwner(request);
  if (!canUpdateLoyaltySettings(owner.role)) {
    throw new HttpsError('permission-denied', 'OWNER access required.');
  }

  const input = updateLoyaltySettingsSchema.parse(request.data ?? {});
  if (input.purchasesRequired === undefined && input.staffCanApproveRewards === undefined) {
    throw new HttpsError(
      'invalid-argument',
      'Provide purchasesRequired and/or staffCanApproveRewards.',
    );
  }

  const db = getFirestore();
  await ensureLoyaltySettingsDoc(db);

  const patch: Record<string, unknown> = {
    updatedBy: owner.uid,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.purchasesRequired !== undefined) {
    patch.purchasesRequired = input.purchasesRequired;
  }
  if (input.staffCanApproveRewards !== undefined) {
    patch.staffCanApproveRewards = input.staffCanApproveRewards;
  }

  await db.doc(LOYALTY_SETTINGS_PATH).set(patch, { merge: true });
  const snap = await db.doc(LOYALTY_SETTINGS_PATH).get();
  const data = snap.data()!;

  await writeActivityLog({
    actorUid: owner.uid,
    actorRole: owner.role,
    action: ACTIVITY_ACTIONS.LOYALTY_SETTINGS_UPDATED,
    entityType: 'settings',
    entityId: 'loyalty',
    metadata: {
      purchasesRequired: data.purchasesRequired,
      staffCanApproveRewards: data.staffCanApproveRewards === true,
    },
  });

  return {
    ok: true as const,
    settings: {
      purchasesRequired: data.purchasesRequired as number,
      staffCanApproveRewards: data.staffCanApproveRewards === true,
    },
  };
});

export const getLoyaltySettings = onCall({ cors: true }, async (request) => {
  // Any signed-in user may read N for display; mutations stay OWNER-only.
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const settings = await ensureLoyaltySettingsDoc();
  return { ok: true as const, settings };
});
