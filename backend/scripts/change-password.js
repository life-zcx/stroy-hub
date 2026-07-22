import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || 'customer@test.com';
  const newPassword = args[1] || '123456';

  console.log(`\n🔑 Инициализация смены пароля (DEV)...`);
  console.log(`Email: ${email}`);
  console.log(`Новый пароль: ${newPassword}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Пользователь с email "${email}" не найден!`);
      const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
      console.log('\nДоступные пользователи в базе:');
      console.table(allUsers);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Пароль успешно изменён!`);
    console.log(`Пользователь ID: ${updatedUser.id}`);
    console.log(`Имя: ${updatedUser.name || 'Не указано'}`);
    console.log(`Роль: ${updatedUser.role}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Новый пароль: ${newPassword}\n`);
  } catch (error) {
    console.error('❌ Ошибка при изменении пароля:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
