import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  ACTIVITY_ACTIONS,
  lookupCustomerByPhoneSchema,
  lookupCustomerByQrSchema,
  normalizePhone,
  type RewardRequestStatus,
} from '@ramkin/shared';
import { requireStaff } from '../auth/claims';
import { writeActivityLog } from '../auth/activity';
import { buildProgressDto, toLookupDto } from './progress';

async function loadCustomerLookup(customerId: string) {
  const db = getFirestore();
  const customerRef = db.collection('customers').doc(customerId);
  const userRef = db.collection('users').doc(customerId);
  const [customerSnap, userSnap] = await Promise.all([customerRef.get(), userRef.get()]);

  if (!customerSnap.exists) {
    throw new HttpsError('not-found', 'Customer not found.');
  }

  const customer = customerSnap.data()!;
  const user = userSnap.data();
  const status = user?.status === 'disabled' ? ('disabled' as const) : ('active' as const);
  const comboId = (customer.currentComboId as string | null | undefined) ?? null;

  let comboData = null;
  let openRewardStatus: RewardRequestStatus | null = null;
  if (comboId) {
    const comboSnap = await db.collection('combos').doc(comboId).get();
    if (comboSnap.exists) {
      comboData = comboSnap.data()!;
      const rewardId = comboData.rewardRequestId as string | null | undefined;
      if (rewardId) {
        const rewardSnap = await db.collection('rewardRequests').doc(rewardId).get();
        if (rewardSnap.exists) {
          openRewardStatus = rewardSnap.data()?.status as RewardRequestStatus;
        }
      }
    }
  }

  const progress = buildProgressDto({
    customerId,
    customer,
    combo: comboData,
    comboId,
    openRewardStatus,
  });

  return toLookupDto(progress, status);
}

export const lookupCustomerByPhone = onCall({ cors: true }, async (request) => {
  const staff = requireStaff(request);
  const input = lookupCustomerByPhoneSchema.parse(request.data ?? {});
  const phone = normalizePhone(input.phone);

  const db = getFirestore();
  const exact = await db.collection('customers').where('phone', '==', phone).limit(1).get();
  let customerId: string | null = exact.empty ? null : exact.docs[0]!.id;

  if (!customerId && !phone.startsWith('+')) {
    const withPlus = await db
      .collection('customers')
      .where('phone', '==', `+${phone}`)
      .limit(1)
      .get();
    customerId = withPlus.empty ? null : withPlus.docs[0]!.id;
  }

  if (!customerId) {
    throw new HttpsError('not-found', 'No customer found for that phone number.');
  }

  const customer = await loadCustomerLookup(customerId);

  await writeActivityLog({
    actorUid: staff.uid,
    actorRole: staff.role,
    action: ACTIVITY_ACTIONS.CUSTOMER_LOOKUP,
    entityType: 'customer',
    entityId: customerId,
    metadata: { method: 'phone', phoneLast4: phone.slice(-4) },
  });

  return { ok: true as const, customer };
});

export const lookupCustomerByQr = onCall({ cors: true }, async (request) => {
  const staff = requireStaff(request);
  const input = lookupCustomerByQrSchema.parse(request.data ?? {});

  const db = getFirestore();
  const match = await db
    .collection('customers')
    .where('qrToken', '==', input.qrToken)
    .limit(1)
    .get();

  if (match.empty) {
    throw new HttpsError('not-found', 'No customer found for that QR token.');
  }

  const customerId = match.docs[0]!.id;
  const customer = await loadCustomerLookup(customerId);

  await writeActivityLog({
    actorUid: staff.uid,
    actorRole: staff.role,
    action: ACTIVITY_ACTIONS.CUSTOMER_LOOKUP,
    entityType: 'customer',
    entityId: customerId,
    metadata: { method: 'qr' },
  });

  return { ok: true as const, customer };
});
