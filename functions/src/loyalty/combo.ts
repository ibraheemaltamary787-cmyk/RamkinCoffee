import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';

export interface CreateComboInput {
  customerId: string;
  requiredPurchases: number;
}

/**
 * Create a new active combo document. Caller must set customers.currentComboId.
 * Never deletes prior combos — history is preserved.
 */
export function createActiveComboInTx(
  tx: Transaction,
  db: Firestore,
  input: CreateComboInput,
): { comboId: string } {
  const comboRef = db.collection('combos').doc();
  tx.set(comboRef, {
    customerId: input.customerId,
    requiredPurchases: input.requiredPurchases,
    purchaseCount: 0,
    status: 'active',
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
    redeemedAt: null,
    rewardRequestId: null,
  });
  return { comboId: comboRef.id };
}

export async function createActiveCombo(
  db: Firestore,
  input: CreateComboInput,
): Promise<string> {
  const comboRef = db.collection('combos').doc();
  await comboRef.set({
    customerId: input.customerId,
    requiredPurchases: input.requiredPurchases,
    purchaseCount: 0,
    status: 'active',
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
    redeemedAt: null,
    rewardRequestId: null,
  });
  return comboRef.id;
}
