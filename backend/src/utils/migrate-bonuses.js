/**
 * migrate-bonuses.js
 * 
 * Одноразовый скрипт для миграции существующих данных бонусов
 * из старой схемы (вычисляемые на лету) в новую таблицу BonusTransaction.
 * 
 * Запуск:
 *   docker compose exec backend node src/utils/migrate-bonuses.js
 */

import prisma from '../config/db.js';

async function migrateBonuses() {
  console.log('🚀 Начало миграции бонусов...\n');

  // Проверяем, есть ли уже записи в BonusTransaction
  const existingCount = await prisma.bonusTransaction.count();
  if (existingCount > 0) {
    console.log(`⚠️  В таблице BonusTransaction уже ${existingCount} записей.`);
    console.log('   Скрипт остановлен, чтобы не создавать дубликаты.');
    console.log('   Если вы уверены, что хотите запустить повторно, очистите таблицу вручную.');
    process.exit(0);
  }

  // 1. Мигрируем earned-бонусы из completed заказов
  console.log('📦 Шаг 1: Миграция начисленных бонусов (completed заказы)...');
  const completedOrders = await prisma.order.findMany({
    where: { status: 'completed', userId: { not: null } },
    select: { id: true, userId: true, totalAmount: true, createdAt: true },
  });

  let earnedCount = 0;
  for (const order of completedOrders) {
    const earnedAmount = Math.round(order.totalAmount * 0.03);
    if (earnedAmount > 0) {
      await prisma.bonusTransaction.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: 'earned',
          status: 'available', // уже выполненные заказы → сразу available
          amount: earnedAmount,
          description: `Миграция: кешбек 3% за заказ #${order.id}`,
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
        },
      });
      earnedCount++;
    }
  }
  console.log(`   ✅ Создано ${earnedCount} earned-транзакций из ${completedOrders.length} заказов\n`);

  // 2. Мигрируем spent-бонусы (заказы с usedBonusPoints > 0)
  console.log('💸 Шаг 2: Миграция потраченных бонусов (usedBonusPoints > 0)...');
  const ordersWithBonuses = await prisma.order.findMany({
    where: {
      usedBonusPoints: { gt: 0 },
      userId: { not: null },
      status: { not: 'cancelled' },
    },
    select: { id: true, userId: true, usedBonusPoints: true, createdAt: true },
  });

  let spentCount = 0;
  for (const order of ordersWithBonuses) {
    await prisma.bonusTransaction.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        type: 'spent',
        status: 'used',
        amount: Math.round(order.usedBonusPoints),
        description: `Миграция: списание бонусов по заказу #${order.id}`,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
      },
    });
    spentCount++;
  }
  console.log(`   ✅ Создано ${spentCount} spent-транзакций\n`);

  // 3. Проверочный расчёт
  console.log('🔍 Шаг 3: Проверка корректности миграции...');
  const allUsers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, email: true },
  });

  let mismatchCount = 0;
  for (const user of allUsers) {
    // Старый расчёт
    const oldCompleted = await prisma.order.findMany({
      where: { userId: user.id, status: 'completed' },
    });
    const oldEarned = oldCompleted.reduce((sum, o) => sum + Math.round(o.totalAmount * 0.03), 0);

    const oldSpentOrders = await prisma.order.findMany({
      where: { userId: user.id, status: { not: 'cancelled' } },
    });
    const oldSpent = oldSpentOrders.reduce((sum, o) => sum + (o.usedBonusPoints || 0), 0);
    const oldBalance = Math.max(0, oldEarned - oldSpent);

    // Новый расчёт
    const [newEarnedAgg, newSpentAgg] = await Promise.all([
      prisma.bonusTransaction.aggregate({
        where: { userId: user.id, type: { in: ['earned', 'manual'] }, status: { in: ['available'] } },
        _sum: { amount: true },
      }),
      prisma.bonusTransaction.aggregate({
        where: { userId: user.id, type: 'spent', status: 'used' },
        _sum: { amount: true },
      }),
    ]);
    const newBalance = Math.max(0, (newEarnedAgg._sum.amount || 0) - (newSpentAgg._sum.amount || 0));

    if (Math.abs(oldBalance - newBalance) > 1) { // допуск ±1 из-за округления
      console.log(`   ⚠️  Пользователь ${user.email} (id=${user.id}): старый=${oldBalance}, новый=${newBalance}`);
      mismatchCount++;
    }
  }

  if (mismatchCount === 0) {
    console.log('   ✅ Все балансы совпадают!\n');
  } else {
    console.log(`   ⚠️  Обнаружено ${mismatchCount} несовпадений. Проверьте данные вручную.\n`);
  }

  console.log('🎉 Миграция завершена!');
  console.log(`   Создано earned-транзакций: ${earnedCount}`);
  console.log(`   Создано spent-транзакций: ${spentCount}`);
  process.exit(0);
}

migrateBonuses().catch((error) => {
  console.error('❌ Ошибка миграции:', error);
  process.exit(1);
});
