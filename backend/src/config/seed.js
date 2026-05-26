import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Посев данных (seeding)...');

  // Очистка БД
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.partnerRequest.deleteMany({});
  await prisma.callbackRequest.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.category.deleteMany({});

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

  const adminPassword = await bcrypt.hash('123', 10);
  const boschPassword = await bcrypt.hash('123', 10);
  const knaufPassword = await bcrypt.hash('123', 10);
  const customerPassword = await bcrypt.hash('123', 10);

  // 1. Администратор платформы
  await prisma.user.create({
    data: {
      email: 'admin@stroy-hub.kz',
      password: adminPassword,
      name: 'Юрий',
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

  console.log('Создание дерева категорий...');

  // Level 1: Root Categories (Родители с фото)
  const mixes = await prisma.category.create({
    data: {
      name: 'Сухие смеси',
      slug: 'mixes',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'
    }
  });

  const lumber = await prisma.category.create({
    data: {
      name: 'Пиломатериалы',
      slug: 'lumber',
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop'
    }
  });

  const tools = await prisma.category.create({
    data: {
      name: 'Инструменты',
      slug: 'tools',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop'
    }
  });

  const paints = await prisma.category.create({
    data: {
      name: 'Краски',
      slug: 'paints',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop'
    }
  });

  const hardware = await prisma.category.create({
    data: {
      name: 'Крепеж',
      slug: 'hardware',
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop'
    }
  });

  // Level 2 & 3: Subcategories (Подродители)
  // Подкатегории для Сухие смеси
  const cementMixes = await prisma.category.create({
    data: {
      name: 'Цементные смеси',
      slug: 'cement-mixes',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop',
      parentId: mixes.id
    }
  });

  const gypsumMixes = await prisma.category.create({
    data: {
      name: 'Гипсовые смеси',
      slug: 'gypsum-mixes',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop',
      parentId: mixes.id
    }
  });

  // Подкатегории для Пиломатериалы
  const boards = await prisma.category.create({
    data: {
      name: 'Доски обрезные',
      slug: 'boards',
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop',
      parentId: lumber.id
    }
  });

  const beams = await prisma.category.create({
    data: {
      name: 'Брусья строганные',
      slug: 'beams',
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop',
      parentId: lumber.id
    }
  });

  // Подкатегории для Инструментов
  const powerTools = await prisma.category.create({
    data: {
      name: 'Электроинструменты',
      slug: 'power-tools',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop',
      parentId: tools.id
    }
  });

  const handTools = await prisma.category.create({
    data: {
      name: 'Ручные инструменты',
      slug: 'hand-tools',
      image: 'https://images.unsplash.com/photo-1530124560072-aae972497282?q=80&w=400&auto=format&fit=crop',
      parentId: tools.id
    }
  });

  // Третий уровень для Электроинструментов
  const rotaryHammers = await prisma.category.create({
    data: {
      name: 'Перфораторы',
      slug: 'rotary-hammers',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop',
      parentId: powerTools.id
    }
  });

  const screwdrivers = await prisma.category.create({
    data: {
      name: 'Шуруповерты',
      slug: 'screwdrivers',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop',
      parentId: powerTools.id
    }
  });

  // Подкатегории для Красок
  const interiorPaints = await prisma.category.create({
    data: {
      name: 'Интерьерные краски',
      slug: 'interior-paints',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop',
      parentId: paints.id
    }
  });

  const enamels = await prisma.category.create({
    data: {
      name: 'Эмали глянцевые',
      slug: 'enamels',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop',
      parentId: paints.id
    }
  });

  // Подкатегории для Крепежа
  const woodScrews = await prisma.category.create({
    data: {
      name: 'Саморезы по дереву',
      slug: 'wood-screws',
      image: 'https://images.unsplash.com/photo-1590236166418-498c199859f8?q=80&w=400&auto=format&fit=crop',
      parentId: hardware.id
    }
  });

  const anchorBolts = await prisma.category.create({
    data: {
      name: 'Анкерные болты',
      slug: 'anchor-bolts',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop',
      parentId: hardware.id
    }
  });

  // Создаем продукты и привязываем их к конечным категориям
  console.log('Создание товаров...');
  const productsData = [
    {
      name: 'Цемент Портланд М500 Д0, 50 кг',
      category: 'mixes',
      categoryId: cementMixes.id,
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
      categoryId: gypsumMixes.id,
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
      categoryId: boards.id,
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
      categoryId: beams.id,
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
      categoryId: rotaryHammers.id,
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
      categoryId: screwdrivers.id,
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
      categoryId: interiorPaints.id,
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
      categoryId: enamels.id,
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
      categoryId: woodScrews.id,
      price: 1200,
      oldPrice: null,
      image: 'https://images.unsplash.com/photo-1590236166418-498c199859f8?w=400&auto=format&fit=crop&q=80',
      rating: 4.7,
      reviews: 312,
      isHit: true,
      bulkDiscount: null,
      supplierId: createdSuppliers['Крепеж-Мастер']
    },
    {
      name: 'Анкерный болт с гайкой 10x100 мм, 50 шт',
      category: 'hardware',
      categoryId: anchorBolts.id,
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

  console.log('Создание промоакций...');

  await prisma.promotion.createMany({
    data: [
      {
        title: 'Скидка 10% на первый заказ от 50 000 ₸',
        description: 'Используйте промокод при первом оформлении и получите дополнительную скидку на строительные материалы из любой категории.',
        badge: 'Новый клиент',
        promoCode: 'STROY10',
        type: 'PROMOCODE',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderAmount: 50000,
        theme: 'emerald',
        isActive: true,
        showOnSite: true,
      },
      {
        title: 'Сезонная акция на крупные закупки',
        description: 'Сэкономьте 25 000 ₸ на крупном заказе материалов для строительства или ремонта.',
        badge: 'Опт',
        promoCode: 'MEGA25000',
        type: 'PROMOCODE',
        discountType: 'FIXED',
        discountValue: 25000,
        minOrderAmount: 300000,
        theme: 'sunset',
        isActive: true,
        showOnSite: true,
      },
      {
        title: 'Партнерская скидка на этой неделе',
        description: 'Следите за разделом акций: каждый месяц можно запускать новые кампании без обязательного промокода.',
        badge: 'Промо-страница',
        promoCode: null,
        type: 'CAMPAIGN',
        discountType: 'PERCENT',
        discountValue: 7,
        minOrderAmount: 100000,
        theme: 'royal',
        isActive: true,
        showOnSite: true,
      },
    ],
  });

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
