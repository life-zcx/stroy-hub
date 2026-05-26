import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Посев данных (seeding)...');

  // Очистка БД
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.supplier.deleteMany({});

  // Создаем дистрибьюторов
  const suppliersData = [
    { name: 'СтройОпт ТОО', delivery: '1-2 дня', rating: 4.8, reviews: 124 },
    { name: 'Кнауф Центр (Прямой склад)', delivery: 'Завтра', rating: 4.9, reviews: 89 },
    { name: 'ЛесТорг База', delivery: '2-3 дня', rating: 4.5, reviews: 42 },
    { name: 'Bosch Official KZ', delivery: 'Завтра', rating: 5.0, reviews: 210 },
    { name: 'Макита-Казахстан', delivery: '1-2 дня', rating: 4.8, reviews: 175 },
    { name: 'ColorStudio (Оф. дилер)', delivery: 'Под заказ (3 дня)', rating: 4.6, reviews: 92 },
    { name: 'Крепеж-Мастер', delivery: 'Завтра', rating: 4.7, reviews: 312 },
  ];

  const createdSuppliers = {};
  for (const sup of suppliersData) {
    const s = await prisma.supplier.create({ data: sup });
    createdSuppliers[sup.name] = s.id;
  }

  // Создаем пользователей
  console.log('Создание тестовых учетных записей...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const boschPassword = await bcrypt.hash('bosch123', 10);
  const knaufPassword = await bcrypt.hash('knauf123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // 1. Администратор платформы
  await prisma.user.create({
    data: {
      email: 'admin@stroy-hub.kz',
      password: adminPassword,
      name: 'Григорий (Администратор)',
      phone: '8 (777) 111-22-33',
      role: 'ADMIN'
    }
  });

  // 2. Представитель Bosch
  await prisma.user.create({
    data: {
      email: 'bosch@stroy-hub.kz',
      password: boschPassword,
      name: 'Представитель Bosch Official',
      phone: '8 (777) 999-88-77',
      role: 'SUPPLIER',
      supplierId: createdSuppliers['Bosch Official KZ']
    }
  });

  // 3. Представитель Knauf
  await prisma.user.create({
    data: {
      email: 'knauf@stroy-hub.kz',
      password: knaufPassword,
      name: 'Представитель Knauf Центр',
      phone: '8 (777) 444-55-66',
      role: 'SUPPLIER',
      supplierId: createdSuppliers['Кнауф Центр (Прямой склад)']
    }
  });

  // 4. Покупатель (Customer)
  await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password: customerPassword,
      name: 'Алексей Кузнецов',
      phone: '+7 (707) 111-22-33',
      address: 'г. Алматы, мкр. Самал-2, д. 15, кв. 42',
      role: 'CUSTOMER'
    }
  });

  // Создаем продукты
  const productsData = [
    {
      name: 'Цемент Портланд М500 Д0, 50 кг',
      category: 'mixes',
      price: 2100,
      oldPrice: 2350,
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80',
      rating: 4.8,
      reviews: 124,
      isHit: true,
      bulkDiscount: 'от 50 шт: 1950 ₸',
      supplierId: createdSuppliers['СтройОпт ТОО']
    },
    {
      name: 'Штукатурка гипсовая Knauf Rotband, 30 кг',
      category: 'mixes',
      price: 4300,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviews: 89,
      isHit: true,
      bulkDiscount: null,
      supplierId: createdSuppliers['Кнауф Центр (Прямой склад)']
    },
    {
      name: 'Доска обрезная 50х150х6000 мм, сосна 1 сорт',
      category: 'lumber',
      price: 4500,
      oldPrice: 4800,
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&auto=format&fit=crop&q=80',
      rating: 4.5,
      reviews: 42,
      isHit: false,
      bulkDiscount: 'от 5 м³: скидка 5%',
      supplierId: createdSuppliers['ЛесТорг База']
    },
    {
      name: 'Брус строганный 100х100х3000 мм, камерная сушка',
      category: 'lumber',
      price: 3200,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=80',
      rating: 4.7,
      reviews: 56,
      isHit: false,
      bulkDiscount: null,
      supplierId: createdSuppliers['ЛесТорг База']
    },
    {
      name: 'Перфоратор Bosch GBH 2-28, 880 Вт, 3.2 Дж',
      category: 'tools',
      price: 78000,
      oldPrice: 85000,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviews: 210,
      isHit: true,
      bulkDiscount: null,
      supplierId: createdSuppliers['Bosch Official KZ']
    },
    {
      name: 'Шуруповерт аккумуляторный Makita DDF482Z 18V',
      category: 'tools',
      price: 65000,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
      rating: 4.8,
      reviews: 175,
      isHit: false,
      bulkDiscount: null,
      supplierId: createdSuppliers['Макита-Казахстан']
    },
    {
      name: 'Краска интерьерная Tikkurila Euro 7 моющаяся, 9 л',
      category: 'paints',
      price: 18500,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80',
      rating: 4.6,
      reviews: 92,
      isHit: false,
      bulkDiscount: null,
      supplierId: createdSuppliers['ColorStudio (Оф. дилер)']
    },
    {
      name: 'Эмаль ПФ-115 глянцевая белая, 2.7 кг',
      category: 'paints',
      price: 2800,
      oldPrice: 3100,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80',
      rating: 4.2,
      reviews: 34,
      isHit: false,
      bulkDiscount: null,
      supplierId: createdSuppliers['ColorStudio (Оф. дилер)']
    },
    {
      name: 'Саморезы по дереву черные 3.5х55 мм, 500 шт',
      category: 'hardware',
      price: 1200,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1610962015564-3773c3736540?w=400&auto=format&fit=crop&q=80',
      rating: 4.7,
      reviews: 312,
      isHit: true,
      bulkDiscount: null,
      supplierId: createdSuppliers['Крепеж-Мастер']
    },
    {
      name: 'Анкерный болт с гайкой 10x100 мм, 50 шт',
      category: 'hardware',
      price: 3500,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviews: 88,
      isHit: false,
      bulkDiscount: null,
      supplierId: createdSuppliers['Крепеж-Мастер']
    }
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  console.log('Посев данных успешно завершен!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
