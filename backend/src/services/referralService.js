import crypto from 'crypto';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const REFERRAL_REWARD_AMOUNT = 1000; // 1,000 KZT bonus points per first completed order
export const MIN_REFERRAL_ORDER_AMOUNT = 15000; // Minimum order sum to trigger referral reward
export const WELCOME_BONUS_AMOUNT = 500; // 500 KZT welcome bonus for invitee / new registration

/**
 * Generate a unique, clean referral code for a user
 */
export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const candidateCode = `REF-${randomHex}`;

    const existing = await prisma.user.findUnique({
      where: { referralCode: candidateCode },
      select: { id: true },
    });

    if (!existing) {
      return candidateCode;
    }
  }

  // Fallback timestamp-based code
  return `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * Ensure user has a referral code generated
 */
export async function ensureUserReferralCode(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true },
  });

  if (!user) return null;

  if (user.referralCode) {
    return user.referralCode;
  }

  const newCode = await generateUniqueReferralCode();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: newCode },
    select: { referralCode: true },
  });

  return updated.referralCode;
}

/**
 * Get comprehensive referral statistics & share links for a user
 */
export async function getReferralSummary(userId, baseUrl = 'https://tormag.kz') {
  const referralCode = await ensureUserReferralCode(userId);

  // Invited users
  const invitedUsers = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      orders: {
        where: { status: 'completed' },
        select: { id: true },
        take: 1,
      },
    },
  });

  const invitedCount = invitedUsers.length;
  const activeReferralsCount = invitedUsers.filter((u) => u.orders.length > 0).length;

  // Total referral bonuses earned
  const bonusAgg = await prisma.bonusTransaction.aggregate({
    where: {
      userId,
      type: 'referral_earned',
      status: { in: ['available', 'used'] },
    },
    _sum: {
      amount: true,
    },
  });

  const totalBonusesEarned = bonusAgg._sum.amount || 0;

  const shareUrl = `${baseUrl.replace(/\/$/, '')}/?ref=${referralCode}`;
  const shareText = `Регистрация в сервисе TORMAG по реферальной ссылке: ${shareUrl}`;

  return {
    referralCode,
    shareUrl,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Реферальная программа TORMAG')}`,
    stats: {
      invitedCount,
      activeReferralsCount,
      totalBonusesEarned,
      rewardAmountPerReferral: REFERRAL_REWARD_AMOUNT,
      minOrderAmount: MIN_REFERRAL_ORDER_AMOUNT,
      welcomeBonusAmount: WELCOME_BONUS_AMOUNT,
    },
  };
}

/**
 * Process referral reward when an order is completed
 */
export async function processReferralRewardForFirstOrder(orderId, txClient = null) {
  const db = txClient || prisma;
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            referredById: true,
          },
        },
      },
    });

    if (!order || !order.user || !order.user.referredById) {
      return null;
    }

    const referrerId = order.user.referredById;

    // Check if order total meets minimum threshold (15,000 KZT)
    if (Number(order.totalAmount || 0) < MIN_REFERRAL_ORDER_AMOUNT) {
      logger.info(`Order #${order.id} total (${order.totalAmount}) is below minimum referral threshold (${MIN_REFERRAL_ORDER_AMOUNT})`);
      return null;
    }

    // Check if a referral reward was ALREADY awarded to the referrer for this invited user
    const existingRewardForUser = await db.bonusTransaction.findFirst({
      where: {
        userId: referrerId,
        type: 'referral_earned',
        order: {
          userId: order.userId,
        },
      },
    });

    if (existingRewardForUser) {
      logger.info(`Referral reward already granted to user #${referrerId} for invited user #${order.userId}`);
      return null;
    }

    // Create bonus transaction for referrer
    const transaction = await db.bonusTransaction.create({
      data: {
        userId: referrerId,
        orderId: order.id,
        type: 'referral_earned',
        status: 'available',
        amount: REFERRAL_REWARD_AMOUNT,
        description: 'Бонус за приглашенного друга',
      },
    });

    logger.info(`Referral reward of ${REFERRAL_REWARD_AMOUNT} KZT credited to user #${referrerId} for order #${order.id}`);
    return transaction;
  } catch (error) {
    logger.error('Error processing referral reward:', error);
    return null;
  }
}
