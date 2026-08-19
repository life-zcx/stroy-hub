import { getUserLoyaltyStatus } from '../utils/loyaltyUtils.js';
import {
  getAvailableBalance,
  createBonusEarned,
  createBonusSpent,
  activatePendingBonuses,
  cancelBonusesForOrder,
} from '../controllers/bonusController.js';
import { broadcastNotification } from '../utils/pushNotifier.js';
import { processReferralRewardForFirstOrder } from './referralService.js';

export const calculateOrderBonusDiscount = async (userId, useBonuses, finalTotalAmount, tx) => {
  const loyalty = await getUserLoyaltyStatus(parseInt(userId, 10));
  let bonusDiscount = 0;
  let updatedTotalAmount = finalTotalAmount;

  if (useBonuses) {
    const availableBalance = await getAvailableBalance(parseInt(userId, 10), tx);
    if (availableBalance > 0) {
      let maxBonusToUse = availableBalance;
      const numericUseBonuses = typeof useBonuses === 'number' ? useBonuses : parseInt(useBonuses, 10);
      if (!isNaN(numericUseBonuses) && numericUseBonuses > 0) {
        maxBonusToUse = Math.min(availableBalance, numericUseBonuses);
      }
      const maxAllowedBonus = Math.floor(updatedTotalAmount * (loyalty.maxBonusPaymentPercent / 100));
      bonusDiscount = Math.min(maxBonusToUse, maxAllowedBonus);
      updatedTotalAmount -= bonusDiscount;
    }
  }

  return { bonusDiscount, updatedTotalAmount, loyalty };
};

export const recordOrderBonusTransactions = async (userId, orderId, bonusDiscount, subtotalAmount, finalTotalAmount, items, loyalty, tx) => {
  if (bonusDiscount > 0) {
    const currentAvailable = await getAvailableBalance(parseInt(userId, 10), tx);
    if (currentAvailable < bonusDiscount) {
      throw new Error(`Недостаточно бонусов на счете. Доступно: ${Math.round(currentAvailable)} ₸, попытались списать: ${Math.round(bonusDiscount)} ₸.`);
    }
    await createBonusSpent(parseInt(userId, 10), orderId, bonusDiscount, tx);
  }

  let earnedAmount = 0;
  const discountRatio = subtotalAmount > 0 ? (finalTotalAmount / subtotalAmount) : 0;

  for (const item of items) {
    const itemPrice = item.price;
    const rate = itemPrice >= 1000000 ? loyalty.highValueCashback : loyalty.baseCashbackPercent;
    const itemFinalTotal = item.price * item.quantity * discountRatio;
    earnedAmount += Math.round(itemFinalTotal * (rate / 100));
  }

  await createBonusEarned(parseInt(userId, 10), orderId, earnedAmount, `Начисление кешбэка за заказ #${orderId}`, tx);

  return { earnedAmount };
};

export const recalculateOrderBonusTransactions = async (userId, orderId, subtotalAmount, finalTotalAmount, items, tx) => {
  if (!userId) return;
  const loyalty = await getUserLoyaltyStatus(parseInt(userId, 10));
  let earnedAmount = 0;
  const discountRatio = subtotalAmount > 0 ? (finalTotalAmount / subtotalAmount) : 0;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const itemPrice = item.price;
    const rate = itemPrice >= 1000000 ? loyalty.highValueCashback : loyalty.baseCashbackPercent;
    const itemFinalTotal = item.price * item.quantity * discountRatio;
    earnedAmount += Math.round(itemFinalTotal * (rate / 100));
  }

  await tx.bonusTransaction.updateMany({
    where: { orderId: parseInt(orderId, 10), type: 'earned' },
    data: { amount: earnedAmount },
  });

  return { earnedAmount };
};

export const handleOrderStatusBonusUpdates = async (orderId, existingUserId, nextStatus, tx) => {
  if (nextStatus === 'completed') {
    await activatePendingBonuses(orderId, tx);
    await processReferralRewardForFirstOrder(orderId, tx);
    const earnedTx = await tx.bonusTransaction.findFirst({
      where: { orderId, type: 'earned' },
    });
    const newBalance = await getAvailableBalance(existingUserId, tx);
    const earnedAmount = earnedTx?.amount || 0;
    if (earnedAmount > 0) {
      broadcastNotification({
        title: `💰 Начислен кешбэк TORMAG!`,
        body: `Вам начислено +${earnedAmount.toLocaleString('ru-RU')} ₸ бонусов за заказ #${orderId}! Ваш новый баланс: ${Math.round(newBalance).toLocaleString('ru-RU')} ₸`,
        icon: '/pwa-192x192.png',
        data: { url: '/cashback' },
      }).catch(() => {});
    }
  } else if (nextStatus === 'cancelled') {
    await cancelBonusesForOrder(orderId, existingUserId, tx);
  }
};
