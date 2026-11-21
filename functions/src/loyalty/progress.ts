import type { DocumentData } from 'firebase-admin/firestore';
import {
  stampsRemaining,
  type ComboStatus,
  type CustomerLookupDto,
  type LoyaltyProgressDto,
  type RewardRequestStatus,
} from '@ramkin/shared';

export function buildProgressDto(input: {
  customerId: string;
  customer: DocumentData;
  combo: DocumentData | null;
  comboId: string | null;
  openRewardStatus?: RewardRequestStatus | null;
}): LoyaltyProgressDto {
  const requiredPurchases =
    typeof input.combo?.requiredPurchases === 'number' ? input.combo.requiredPurchases : 9;
  const purchaseCount =
    typeof input.combo?.purchaseCount === 'number' ? input.combo.purchaseCount : 0;
  const comboStatus = (input.combo?.status as ComboStatus | undefined) ?? null;
  const remaining = stampsRemaining(purchaseCount, requiredPurchases);
  const rewardEligible =
    comboStatus === 'completed' &&
    purchaseCount >= requiredPurchases &&
    !input.combo?.rewardRequestId;

  return {
    customerId: input.customerId,
    displayName: String(input.customer.displayName ?? ''),
    phone: (input.customer.phone as string | null | undefined) ?? null,
    email: (input.customer.email as string | null | undefined) ?? null,
    qrToken: String(input.customer.qrToken ?? ''),
    currentComboId: input.comboId,
    purchaseCount,
    requiredPurchases,
    remaining,
    comboStatus,
    rewardEligible,
    openRewardRequestId: (input.combo?.rewardRequestId as string | null | undefined) ?? null,
    openRewardStatus: input.openRewardStatus ?? null,
    totalPurchases:
      typeof input.customer.totalPurchases === 'number' ? input.customer.totalPurchases : 0,
    totalRewardsRedeemed:
      typeof input.customer.totalRewardsRedeemed === 'number'
        ? input.customer.totalRewardsRedeemed
        : 0,
  };
}

export function toLookupDto(
  progress: LoyaltyProgressDto,
  status: 'active' | 'disabled',
): CustomerLookupDto {
  return {
    customerId: progress.customerId,
    displayName: progress.displayName,
    phone: progress.phone,
    email: progress.email,
    qrToken: progress.qrToken,
    status,
    currentComboId: progress.currentComboId,
    purchaseCount: progress.purchaseCount,
    requiredPurchases: progress.requiredPurchases,
    remaining: progress.remaining,
    comboStatus: progress.comboStatus,
    rewardEligible: progress.rewardEligible,
    openRewardRequestId: progress.openRewardRequestId,
    openRewardStatus: progress.openRewardStatus,
    totalPurchases: progress.totalPurchases,
    totalRewardsRedeemed: progress.totalRewardsRedeemed,
  };
}
