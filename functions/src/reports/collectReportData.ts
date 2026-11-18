import {
  getFirestore,
  type Firestore,
  type Query,
  type Timestamp,
} from 'firebase-admin/firestore';
import {
  customerMatchesQuery,
  type ExportReportParsed,
  type ReportCustomerRow,
  type ReportDataDto,
  type ReportPurchaseRow,
  type ReportRewardRow,
  type ReportSummaryDto,
} from '@ramkin/shared';
import { parseBoundary, toIso } from '../admin/time';

interface CustomerCacheEntry {
  displayName: string;
  phone: string | null;
  status: string;
  currentComboId: string | null;
  comboStatus: string | null;
  purchaseCount: number;
  requiredPurchases: number;
  totalPurchases: number;
  totalRewardsRedeemed: number;
  createdAt: string | null;
}

async function loadCustomerCache(
  db: Firestore,
  ids: Set<string>,
): Promise<Map<string, CustomerCacheEntry>> {
  const cache = new Map<string, CustomerCacheEntry>();
  const idList = [...ids];

  for (let i = 0; i < idList.length; i += 25) {
    const chunk = idList.slice(i, i + 25);
    await Promise.all(
      chunk.map(async (id) => {
        const [customerSnap, userSnap] = await Promise.all([
          db.collection('customers').doc(id).get(),
          db.collection('users').doc(id).get(),
        ]);
        if (!customerSnap.exists) return;
        const data = customerSnap.data()!;
        const user = userSnap.data();
        const comboId = (data.currentComboId as string | null | undefined) ?? null;
        let comboStatus: string | null = null;
        let purchaseCount = 0;
        let requiredPurchases = 9;
        if (comboId) {
          const comboSnap = await db.collection('combos').doc(comboId).get();
          const combo = comboSnap.data();
          if (combo) {
            comboStatus = (combo.status as string | undefined) ?? null;
            purchaseCount = typeof combo.purchaseCount === 'number' ? combo.purchaseCount : 0;
            requiredPurchases =
              typeof combo.requiredPurchases === 'number' ? combo.requiredPurchases : 9;
          }
        }
        cache.set(id, {
          displayName: String(data.displayName ?? ''),
          phone: (data.phone as string | null | undefined) ?? null,
          status: ((user?.status as string | undefined) ?? 'active') as string,
          currentComboId: comboId,
          comboStatus,
          purchaseCount,
          requiredPurchases,
          totalPurchases: typeof data.totalPurchases === 'number' ? data.totalPurchases : 0,
          totalRewardsRedeemed:
            typeof data.totalRewardsRedeemed === 'number' ? data.totalRewardsRedeemed : 0,
          createdAt: toIso(data.createdAt as Timestamp | undefined),
        });
      }),
    );
  }

  return cache;
}

function matchesSearch(
  cache: Map<string, CustomerCacheEntry>,
  customerId: string,
  search: string | undefined,
): boolean {
  if (!search) return true;
  const entry = cache.get(customerId);
  if (!entry) return false;
  return customerMatchesQuery(
    { displayName: entry.displayName, phone: entry.phone },
    search,
  );
}

export async function collectReportData(input: ExportReportParsed): Promise<ReportDataDto> {
  const db = getFirestore();
  const sheets = new Set(input.sheets);
  const limit = input.limit;

  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (input.from) fromDate = parseBoundary(input.from, false);
  if (input.to) toDate = parseBoundary(input.to, true);

  const customers: ReportCustomerRow[] = [];
  const purchases: ReportPurchaseRow[] = [];
  const rewards: ReportRewardRow[] = [];

  if (sheets.has('customers')) {
    const fetchLimit = input.search ? Math.min(800, Math.max(limit * 3, 100)) : limit;
    const snap = await db
      .collection('customers')
      .orderBy('createdAt', 'desc')
      .limit(fetchLimit)
      .get();

    const ids = new Set(snap.docs.map((d) => d.id));
    const cache = await loadCustomerCache(db, ids);

    for (const doc of snap.docs) {
      const entry = cache.get(doc.id);
      if (!entry) continue;
      if (input.search && !customerMatchesQuery(entry, input.search)) continue;
      if (fromDate && entry.createdAt && new Date(entry.createdAt) < fromDate) continue;
      if (toDate && entry.createdAt && new Date(entry.createdAt) > toDate) continue;
      customers.push({
        customerId: doc.id,
        displayName: entry.displayName,
        phone: entry.phone,
        status: entry.status,
        currentComboId: entry.currentComboId,
        comboStatus: entry.comboStatus,
        purchaseCount: entry.purchaseCount,
        requiredPurchases: entry.requiredPurchases,
        totalPurchases: entry.totalPurchases,
        totalRewardsRedeemed: entry.totalRewardsRedeemed,
        createdAt: entry.createdAt,
      });
      if (customers.length >= limit) break;
    }
  }

  if (sheets.has('purchases')) {
    let query: Query = db.collection('purchases');
    if (input.recordedBy) {
      query = query.where('recordedBy', '==', input.recordedBy);
    }
    if (fromDate) {
      query = query.where('createdAt', '>=', fromDate);
    }
    if (toDate) {
      query = query.where('createdAt', '<=', toDate);
    }
    const fetchLimit = input.search ? Math.min(1500, limit * 3) : limit;
    query = query.orderBy('createdAt', 'desc').limit(fetchLimit);
    const snap = await query.get();

    const ids = new Set(snap.docs.map((d) => d.data().customerId as string));
    const cache = await loadCustomerCache(db, ids);

    for (const doc of snap.docs) {
      const data = doc.data();
      const customerId = data.customerId as string;
      if (!matchesSearch(cache, customerId, input.search)) continue;
      const entry = cache.get(customerId);
      purchases.push({
        purchaseId: doc.id,
        customerId,
        customerName: entry?.displayName ?? null,
        customerPhone: entry?.phone ?? null,
        comboId: data.comboId as string,
        recordedBy: data.recordedBy as string,
        amount: typeof data.amount === 'number' ? data.amount : null,
        note: (data.note as string | null | undefined) ?? null,
        createdAt: toIso(data.createdAt as Timestamp | undefined),
      });
      if (purchases.length >= limit) break;
    }
  }

  if (sheets.has('rewards')) {
    let query: Query = db.collection('rewardRequests');
    if (input.rewardStatus) {
      query = query.where('status', '==', input.rewardStatus);
    }
    if (fromDate) {
      query = query.where('requestedAt', '>=', fromDate);
    }
    if (toDate) {
      query = query.where('requestedAt', '<=', toDate);
    }
    const fetchLimit = input.search ? Math.min(1500, limit * 3) : limit;
    query = query.orderBy('requestedAt', 'desc').limit(fetchLimit);
    const snap = await query.get();

    const ids = new Set(snap.docs.map((d) => d.data().customerId as string));
    const cache = await loadCustomerCache(db, ids);

    for (const doc of snap.docs) {
      const data = doc.data();
      const customerId = data.customerId as string;
      if (!matchesSearch(cache, customerId, input.search)) continue;
      const entry = cache.get(customerId);
      rewards.push({
        requestId: doc.id,
        customerId,
        customerName: entry?.displayName ?? null,
        customerPhone: entry?.phone ?? null,
        comboId: data.comboId as string,
        status: data.status as string,
        requestedAt: toIso(data.requestedAt as Timestamp | undefined),
        reviewedBy: (data.reviewedBy as string | null | undefined) ?? null,
        reviewedAt: toIso(data.reviewedAt as Timestamp | undefined),
        rejectedReason: (data.rejectedReason as string | null | undefined) ?? null,
        redeemedBy: (data.redeemedBy as string | null | undefined) ?? null,
        redeemedAt: toIso(data.redeemedAt as Timestamp | undefined),
      });
      if (rewards.length >= limit) break;
    }
  }

  const rewardStatusCounts: Record<string, number> = {};
  for (const r of rewards) {
    rewardStatusCounts[r.status] = (rewardStatusCounts[r.status] ?? 0) + 1;
  }

  const summary: ReportSummaryDto = {
    generatedAt: new Date().toISOString(),
    from: input.from ?? null,
    to: input.to ?? null,
    rewardStatus: input.rewardStatus ?? null,
    search: input.search ?? null,
    recordedBy: input.recordedBy ?? null,
    customerCount: customers.length,
    purchaseCount: purchases.length,
    rewardCount: rewards.length,
    rewardStatusCounts,
  };

  return { summary, customers, purchases, rewards };
}
