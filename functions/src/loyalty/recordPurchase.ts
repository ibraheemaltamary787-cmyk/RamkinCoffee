import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  applyPurchaseToCombo,
  LoyaltyTransitionError,
  recordPurchaseSchema,
  stampsRemaining,
  type ComboSnapshot,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { ensureLoyaltySettingsDoc } from './settings';
import { createActiveComboInTx } from './combo';

export const recordPurchase = onCall({ cors: true }, async (request) => {
  const staff = requireStaff(request);
  const input = recordPurchaseSchema.parse(request.data ?? {});

  const db = getFirestore();
  const settings = await ensureLoyaltySettingsDoc(db);

  const customerRef = db.collection('customers').doc(input.customerId);
  const userRef = db.collection('users').doc(input.customerId);
  // Idempotency: purchase doc id = idempotencyKey (unique constraint).
  const purchaseRef = db.collection('purchases').doc(input.idempotencyKey);

  const result = await db.runTransaction(async (tx) => {
    const existingPurchase = await tx.get(purchaseRef);
    if (existingPurchase.exists) {
      const prior = existingPurchase.data()!;
      if (prior.customerId !== input.customerId) {
        throw new HttpsError(
          'already-exists',
          'Idempotency key already used for a different customer.',
        );
      }
      const priorCombo = await tx.get(db.collection('combos').doc(prior.comboId));
      const combo = priorCombo.data() ?? {};
      return {
        deduped: true as const,
        purchaseId: purchaseRef.id,
        comboId: prior.comboId as string,
        purchaseCount: typeof combo.purchaseCount === 'number' ? combo.purchaseCount : 0,
        requiredPurchases:
          typeof combo.requiredPurchases === 'number' ? combo.requiredPurchases : 9,
        comboStatus: (combo.status as string) ?? 'active',
        completed: combo.status === 'completed',
      };
    }

    const [customerSnap, userSnap] = await Promise.all([tx.get(customerRef), tx.get(userRef)]);
    if (!customerSnap.exists) {
      throw new HttpsError('not-found', 'Customer not found.');
    }
    const customer = customerSnap.data()!;
    const user = userSnap.data();
    if (user?.status === 'disabled') {
      throw new HttpsError('failed-precondition', 'Customer account is disabled.');
    }

    let comboId = (customer.currentComboId as string | null | undefined) ?? null;
    let comboData: DocumentData | null = null;
    let comboWasMissing = false;

    if (comboId) {
      const comboSnap = await tx.get(db.collection('combos').doc(comboId));
      if (comboSnap.exists) {
        comboData = comboSnap.data()!;
      } else {
        comboWasMissing = true;
      }
    } else {
      comboWasMissing = true;
    }

    if (comboWasMissing) {
      const created = createActiveComboInTx(tx, db, {
        customerId: input.customerId,
        requiredPurchases: settings.purchasesRequired,
      });
      comboId = created.comboId;
      comboData = {
        customerId: input.customerId,
        requiredPurchases: settings.purchasesRequired,
        purchaseCount: 0,
        status: 'active',
        rewardRequestId: null,
      };
      tx.set(customerRef, { currentComboId: comboId }, { merge: true });
    }

    if (!comboId || !comboData) {
      throw new HttpsError('internal', 'Failed to resolve customer combo.');
    }

    if (comboData.customerId && comboData.customerId !== input.customerId) {
      throw new HttpsError('failed-precondition', 'Combo does not belong to this customer.');
    }

    const snapshot: ComboSnapshot = {
      id: comboId,
      customerId: input.customerId,
      requiredPurchases:
        typeof comboData.requiredPurchases === 'number' ? comboData.requiredPurchases : 9,
      purchaseCount: typeof comboData.purchaseCount === 'number' ? comboData.purchaseCount : 0,
      status: (comboData.status as ComboSnapshot['status']) ?? 'active',
      rewardRequestId: (comboData.rewardRequestId as string | null | undefined) ?? null,
    };

    let transition;
    try {
      transition = applyPurchaseToCombo(snapshot);
    } catch (err) {
      if (err instanceof LoyaltyTransitionError) {
        throw new HttpsError('failed-precondition', err.message);
      }
      throw err;
    }

    const comboRef = db.collection('combos').doc(comboId);
    const comboUpdate: Record<string, unknown> = {
      purchaseCount: transition.purchaseCount,
      status: transition.status,
    };
    if (transition.completed) {
      comboUpdate.completedAt = FieldValue.serverTimestamp();
    }
    tx.update(comboRef, comboUpdate);

    tx.set(purchaseRef, {
      customerId: input.customerId,
      comboId,
      recordedBy: staff.uid,
      amount: input.amount ?? null,
      note: input.note ?? null,
      idempotencyKey: input.idempotencyKey,
      clientRequestId: input.clientRequestId ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      customerRef,
      {
        totalPurchases: FieldValue.increment(1),
        currentComboId: comboId,
      },
      { merge: true },
    );

    return {
      deduped: false as const,
      purchaseId: purchaseRef.id,
      comboId,
      purchaseCount: transition.purchaseCount,
      requiredPurchases: snapshot.requiredPurchases,
      comboStatus: transition.status,
      completed: transition.completed,
    };
  });

  if (!result.deduped) {
    await writeActivityLog({
      actorUid: staff.uid,
      actorRole: staff.role,
      action: ACTIVITY_ACTIONS.PURCHASE_RECORDED,
      entityType: 'purchase',
      entityId: result.purchaseId,
      metadata: {
        customerId: input.customerId,
        comboId: result.comboId,
        purchaseCount: result.purchaseCount,
        completed: result.completed,
      },
    });
  }

  return {
    ok: true as const,
    ...result,
    remaining: stampsRemaining(result.purchaseCount, result.requiredPurchases),
  };
});
