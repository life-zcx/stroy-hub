import prisma from '../config/db.js';

export const createOrder = async (req, res) => {
  const { clientName, clientPhone, clientAddress, paymentMethod, totalAmount, items } = req.body;

  if (!clientName || !clientPhone || !clientAddress || !paymentMethod || !totalAmount || !items || !items.length) {
    return res.status(400).json({ error: 'Все поля заказа и товары обязательны' });
  }

  // Expect authenticated user from verifyToken middleware
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Для оформления заказа необходимо войти в систему' });
  }

  try {
    // 1. Verify that all products in the order exist in the database
    const productIds = items.map(item => parseInt(item.productId));
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'Некоторые товары из вашей корзины устарели или больше не существуют (база данных была обновлена). Пожалуйста, очистите корзину и добавьте актуальные товары.' 
      });
    }

    // 2. Perform transaction to ensure consistent writing of Order and OrderItems
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          clientAddress,
          paymentMethod,
          totalAmount: parseFloat(totalAmount),
          userId: parseInt(userId),
          items: {
            create: items.map(item => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price)
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания заказа: ' + error.message });
  }
};

export const getAllOrders = async (req, res) => {
  const user = req.user;
  const where = {};

  if (!user) {
    return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
  }

  // Filter orders by role:
  // - CUSTOMER: only their own orders
  // - SUPPLIER: orders containing their products
  // - ADMIN: all orders
  if (user.role === 'CUSTOMER') {
    where.userId = user.id;
  } else if (user.role === 'SUPPLIER') {
    where.items = {
      some: {
        product: {
          supplierId: parseInt(user.supplierId)
        }
      }
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка заказов: ' + error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Статус обязателен' });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Неверный статус заказа' });
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа: ' + error.message });
  }
};
