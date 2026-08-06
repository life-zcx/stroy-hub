import prisma from '../src/config/db.js';

async function checkUserBonuses() {
  const user = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    orderBy: { id: 'asc' },
  });

  if (!user) {
    console.log('Пользователь не найден');
    process.exit(1);
  }

  console.log(`=== Пользователь ID: ${user.id}, Email: ${user.email} ===`);

  const txs = await prisma.bonusTransaction.findMany({
    where: { userId: user.id },
    orderBy: { id: 'asc' },
  });

  console.log('\n--- Все бонусные транзакции ---');
  console.table(txs.map(t => ({
    id: t.id,
    type: t.type,
    status: t.status,
    amount: t.amount,
    orderId: t.orderId,
    description: t.description,
  })));

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: { id: true, status: true, totalAmount: true, usedBonusPoints: true }
  });

  console.log('\n--- Все заказы пользователя ---');
  console.table(orders);

  process.exit(0);
}

checkUserBonuses().catch(err => {
  console.error(err);
  process.exit(1);
});
