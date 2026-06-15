import prisma from '../config/db.js';

export const LOYALTY_TIERS = {
  PARTICIPANT: {
    key: 'participant',
    name: 'Участник',
    minSpent: 0,
    baseCashback: 3,
    highValueCashback: 1.0,
    maxBonusPaymentPercent: 50,
  },
  RESIDENT: {
    key: 'resident',
    name: 'Резидент',
    minSpent: 500000,
    baseCashback: 4,
    highValueCashback: 1.5,
    maxBonusPaymentPercent: 75,
  },
  PARTNER: {
    key: 'partner',
    name: 'Партнёр',
    minSpent: 2000000,
    baseCashback: 5,
    highValueCashback: 2.5,
    maxBonusPaymentPercent: 100,
  },
};

/**
 * Calculates total spent by user on completed orders in the current calendar year.
 */
export async function getCompletedSpentThisYear(userId) {
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const aggregate = await prisma.order.aggregate({
    where: {
      userId: parseInt(userId, 10),
      status: 'completed',
      createdAt: { gte: currentYearStart },
    },
    _sum: {
      totalAmount: true,
    },
  });
  return aggregate._sum.totalAmount || 0;
}

/**
 * Resolves the user's loyalty level configuration based on total spent.
 */
export function getLoyaltyTier(spent) {
  if (spent >= LOYALTY_TIERS.PARTNER.minSpent) {
    return LOYALTY_TIERS.PARTNER;
  }
  if (spent >= LOYALTY_TIERS.RESIDENT.minSpent) {
    return LOYALTY_TIERS.RESIDENT;
  }
  return LOYALTY_TIERS.PARTICIPANT;
}

/**
 * Gets the full loyalty status details for a user.
 */
export async function getUserLoyaltyStatus(userId) {
  if (!userId) {
    return {
      level: LOYALTY_TIERS.PARTICIPANT.key,
      levelName: LOYALTY_TIERS.PARTICIPANT.name,
      totalSpentThisYear: 0,
      nextLevel: LOYALTY_TIERS.RESIDENT.key,
      nextLevelName: LOYALTY_TIERS.RESIDENT.name,
      neededToNextLevel: LOYALTY_TIERS.RESIDENT.minSpent,
      progressPercent: 0,
      maxBonusPaymentPercent: LOYALTY_TIERS.PARTICIPANT.maxBonusPaymentPercent,
      baseCashbackPercent: LOYALTY_TIERS.PARTICIPANT.baseCashback,
      highValueCashback: LOYALTY_TIERS.PARTICIPANT.highValueCashback,
    };
  }

  const spent = await getCompletedSpentThisYear(userId);
  const currentTier = getLoyaltyTier(spent);

  let nextLevel = null;
  let nextLevelName = null;
  let neededToNextLevel = 0;
  let progressPercent = 100;

  if (currentTier.key === LOYALTY_TIERS.PARTICIPANT.key) {
    nextLevel = LOYALTY_TIERS.RESIDENT.key;
    nextLevelName = LOYALTY_TIERS.RESIDENT.name;
    neededToNextLevel = Math.max(0, LOYALTY_TIERS.RESIDENT.minSpent - spent);
    progressPercent = Math.min(100, Math.round((spent / LOYALTY_TIERS.RESIDENT.minSpent) * 100));
  } else if (currentTier.key === LOYALTY_TIERS.RESIDENT.key) {
    nextLevel = LOYALTY_TIERS.PARTNER.key;
    nextLevelName = LOYALTY_TIERS.PARTNER.name;
    neededToNextLevel = Math.max(0, LOYALTY_TIERS.PARTNER.minSpent - spent);
    const range = LOYALTY_TIERS.PARTNER.minSpent - LOYALTY_TIERS.RESIDENT.minSpent;
    const progressInRange = spent - LOYALTY_TIERS.RESIDENT.minSpent;
    progressPercent = Math.min(100, Math.round((progressInRange / range) * 100));
  }

  return {
    level: currentTier.key,
    levelName: currentTier.name,
    totalSpentThisYear: Math.round(spent),
    nextLevel,
    nextLevelName,
    neededToNextLevel: Math.round(neededToNextLevel),
    progressPercent,
    maxBonusPaymentPercent: currentTier.maxBonusPaymentPercent,
    baseCashbackPercent: currentTier.baseCashback,
    highValueCashback: currentTier.highValueCashback,
  };
}

/**
 * Calculates cashback amount for a specific product and price based on user tier.
 */
export function calculateProductCashback(price, quantity, loyaltyTier) {
  const itemPrice = parseFloat(price);
  const qty = parseInt(quantity, 10) || 1;
  const totalItemPrice = itemPrice * qty;

  const rate = itemPrice >= 1000000 
    ? loyaltyTier.highValueCashback 
    : loyaltyTier.baseCashback;

  return Math.round(totalItemPrice * (rate / 100));
}
