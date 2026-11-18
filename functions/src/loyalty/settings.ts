import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { DEFAULT_PURCHASES_REQUIRED, defaultLoyaltySettings } from '@ramkin/shared';

export const LOYALTY_SETTINGS_PATH = 'settings/loyalty';

export interface LoyaltySettingsResolved {
  purchasesRequired: number;
  staffCanApproveRewards: boolean;
}

export async function getOrCreateLoyaltySettings(
  db: Firestore = getFirestore(),
): Promise<LoyaltySettingsResolved> {
  const ref = db.doc(LOYALTY_SETTINGS_PATH);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() ?? {};
    return {
      purchasesRequired:
        typeof data.purchasesRequired === 'number' && data.purchasesRequired >= 1
          ? Math.floor(data.purchasesRequired)
          : DEFAULT_PURCHASES_REQUIRED,
      staffCanApproveRewards: data.staffCanApproveRewards === true,
    };
  }

  const defaults = defaultLoyaltySettings();
  await ref.set({
    ...defaults,
    updatedBy: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return defaults;
}

/** Transaction-safe read; creates defaults outside if missing before tx. */
export async function ensureLoyaltySettingsDoc(
  db: Firestore = getFirestore(),
): Promise<LoyaltySettingsResolved> {
  return getOrCreateLoyaltySettings(db);
}
