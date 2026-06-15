import prisma from '../config/db.js';
import { getUserLoyaltyStatus } from '../utils/loyaltyUtils.js';

// ─────────────────────────────────────────────
// Утилитарные функции (переиспользуются в orderController)
// ─────────────────────────────────────────────

/**
 * Возвращает доступный баланс бонусов пользователя.
 * Если передан `tx` (Prisma transaction client) — работает в рамках транзакции.
 */
export async function getAvailableBalance(userId, tx = prisma) {
  const [earnedResult, spentResult] = await Promise.all([
    tx.bonusTransaction.aggregate({
      where: { userId, status: 'available', type: { in: ['earned', 'manual'] } },
      _sum: { amount: true },
    }),
    tx.bonusTransaction.aggregate({
      where: { userId, status: 'used', type: 'spent' },
      _sum: { amount: true },
    }),
  ]);
  const totalEarned = earnedResult._sum.amount || 0;
  const totalSpent = spentResult._sum.amount || 0;
  return Math.max(0, totalEarned - totalSpent);
}

/**
 * Возвращает pending-баланс (бонусы за заказы, ещё не выполненные).
 */
export async function getPendingBalance(userId, tx = prisma) {
  const result = await tx.bonusTransaction.aggregate({
    where: { userId, status: 'pending', type: 'earned' },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

/**
 * Создаёт запись "начисление бонусов" (статус pending — до выполнения заказа).
 */
export async function createBonusEarned(userId, orderId, amount, description, tx = prisma) {
  if (amount <= 0) return null;
  return tx.bonusTransaction.create({
    data: {
      userId,
      orderId,
      type: 'earned',
      status: 'pending',
      amount: Math.round(amount),
      description: description || `Начисление кешбэка за заказ #${orderId}`,
    },
  });
}

/**
 * Создаёт запись "списание бонусов" при оплате.
 */
export async function createBonusSpent(userId, orderId, amount, tx = prisma) {
  if (amount <= 0) return null;
  return tx.bonusTransaction.create({
    data: {
      userId,
      orderId,
      type: 'spent',
      status: 'used',
      amount: Math.round(amount),
      description: `Оплата бонусами по заказу #${orderId}`,
    },
  });
}

/**
 * При смене статуса заказа на "completed":
 * переводит pending-бонусы → available.
 */
export async function activatePendingBonuses(orderId, tx = prisma) {
  return tx.bonusTransaction.updateMany({
    where: { orderId, type: 'earned', status: 'pending' },
    data: { status: 'available' },
  });
}

/**
 * При отмене заказа:
 * 1. Отменяем pending-начисления.
 * 2. Возвращаем потраченные бонусы обратно (если были).
 */
export async function cancelBonusesForOrder(orderId, userId, tx = prisma) {
  // 1. Отменяем pending earned
  await tx.bonusTransaction.updateMany({
    where: { orderId, type: 'earned', status: 'pending' },
    data: { status: 'cancelled' },
  });

  // 2. Находим spent-транзакции по этому заказу
  const spentTxs = await tx.bonusTransaction.findMany({
    where: { orderId, type: 'spent', status: 'used' },
  });

  // 3. Возвращаем бонусы через новую manual-транзакцию
  for (const spent of spentTxs) {
    await tx.bonusTransaction.create({
      data: {
        userId,
        orderId,
        type: 'manual',
        status: 'available',
        amount: spent.amount,
        description: `Возврат бонусов по отменённому заказу #${orderId}`,
      },
    });
  }
}

// ─────────────────────────────────────────────
// API Handlers
// ─────────────────────────────────────────────

/**
 * GET /api/bonuses/summary
 * Возвращает итоговый баланс и статистику пользователя.
 */
export const getUserBonusSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Пользователь не авторизован' });

    const [availableBalance, pendingBalance, totalEarnedAgg, totalSpentAgg, loyalty] = await Promise.all([
      getAvailableBalance(userId),
      getPendingBalance(userId),
      prisma.bonusTransaction.aggregate({
        where: { userId, type: { in: ['earned', 'manual'] }, status: { in: ['available', 'used'] } },
        _sum: { amount: true },
      }),
      prisma.bonusTransaction.aggregate({
        where: { userId, type: 'spent', status: 'used' },
        _sum: { amount: true },
      }),
      getUserLoyaltyStatus(userId),
    ]);

    res.json({
      availableBalance: Math.round(availableBalance),
      pendingBalance: Math.round(pendingBalance),
      totalEarned: Math.round(totalEarnedAgg._sum.amount || 0),
      totalSpent: Math.round(totalSpentAgg._sum.amount || 0),
      loyalty,
      // Оставляем старое поле для обратной совместимости
      availableBonusPoints: Math.round(availableBalance),
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения бонусного баланса: ' + error.message });
  }
};

/**
 * GET /api/bonuses/history?page=1&limit=20
 * Постраничная история бонусных транзакций пользователя.
 */
export const getBonusHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Пользователь не авторизован' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [transactions, total] = await prisma.$transaction([
      prisma.bonusTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          description: true,
          orderId: true,
          createdAt: true,
        },
      }),
      prisma.bonusTransaction.count({ where: { userId } }),
    ]);

    res.json({
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения истории бонусов: ' + error.message });
  }
};

/**
 * POST /api/bonuses/admin/adjust
 * Ручная корректировка бонусов (только ADMIN).
 * Body: { userId, amount, description, type: "manual" | "cancelled" }
 */
export const manualAdjustBonus = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount || !description) {
      return res.status(400).json({ error: 'userId, amount и description обязательны' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({ error: 'Некорректная сумма' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Fetch the admin user who is performing this adjustment
    const adminUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const adminName = adminUser?.name || adminUser?.email || 'Администратор';
    const finalDescription = `${description} (Выполнил: ${adminName})`;

    const isDeduction = parsedAmount < 0;

    const transaction = await prisma.bonusTransaction.create({
      data: {
        userId: parseInt(userId),
        type: isDeduction ? 'spent' : 'manual',
        status: isDeduction ? 'used' : 'available',
        amount: Math.abs(parsedAmount),
        description: finalDescription,
      },
    });

    const newBalance = await getAvailableBalance(parseInt(userId));

    res.json({
      transaction,
      newBalance: Math.round(newBalance),
      message: `Бонусы скорректированы. Новый баланс: ${Math.round(newBalance)} ₸`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка корректировки бонусов: ' + error.message });
  }
};
