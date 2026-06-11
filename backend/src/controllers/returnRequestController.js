import prisma from '../config/db.js';

// Client: Create Return Request
export const createReturnRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, productId, quantity, reason } = req.body;

    if (!orderId || !productId || !quantity || !reason) {
      return res.status(400).json({ error: 'Все поля (orderId, productId, quantity, reason) обязательны.' });
    }

    const orderIdInt = parseInt(orderId);
    const productIdInt = parseInt(productId);
    const quantityInt = parseInt(quantity);

    if (isNaN(orderIdInt) || isNaN(productIdInt) || isNaN(quantityInt) || quantityInt <= 0) {
      return res.status(400).json({ error: 'Некорректные параметры запроса.' });
    }

    // 1. Check order exists and belongs to user, and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderIdInt },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден.' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Вы можете оформить возврат только для своих заказов.' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Возврат возможен только для выполненных заказов.' });
    }

    // 2. Check product exists in the order
    const orderItem = order.items.find(item => item.productId === productIdInt);
    if (!orderItem) {
      return res.status(400).json({ error: 'Указанный товар отсутствует в данном заказе.' });
    }

    // 2.5 Calculate completed date from status history
    let completedDate = order.createdAt;
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const completedEntry = order.statusHistory.find(h => h.status === 'completed');
      if (completedEntry && completedEntry.changedAt) {
        completedDate = new Date(completedEntry.changedAt);
      }
    }

    // Fetch product to check category and rules
    const product = await prisma.product.findUnique({
      where: { id: productIdInt }
    });
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден.' });
    }

    // Fetch all warranty rules to find the best match
    const rules = await prisma.warrantyRule.findMany();
    const productRule = rules.find(r => r.scope === 'product' && r.targetId === productIdInt);
    const categoryRule = product.categoryId ? rules.find(r => r.scope === 'category' && r.targetId === product.categoryId) : null;
    const globalRule = rules.find(r => r.scope === 'global');

    let warrantyDays = 14; // Default legal limit
    if (productRule) {
      warrantyDays = productRule.days;
    } else if (categoryRule) {
      warrantyDays = categoryRule.days;
    } else if (globalRule) {
      warrantyDays = globalRule.days;
    }

    const deadline = new Date(completedDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      return res.status(400).json({
        error: `Срок возврата товара (${warrantyDays} дн.) истек ${deadline.toLocaleDateString('ru-RU')}.`
      });
    }

    // 3. Check already returned quantity
    const existingReturns = await prisma.returnRequest.findMany({
      where: {
        orderId: orderIdInt,
        productId: productIdInt,
        status: { in: ['pending', 'approved', 'rejected'] }
      }
    });

    const alreadyReturnedQty = existingReturns.reduce((sum, ret) => sum + ret.quantity, 0);
    if (alreadyReturnedQty + quantityInt > orderItem.quantity) {
      return res.status(400).json({
        error: `Превышено количество товара для возврата. Вы уже вернули/оформили возврат на ${alreadyReturnedQty} шт. Доступно для возврата: ${orderItem.quantity - alreadyReturnedQty} шт.`
      });
    }

    // Get photo path
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    // 4. Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId: orderIdInt,
        productId: productIdInt,
        quantity: quantityInt,
        reason,
        photoUrl,
        userId,
        status: 'pending'
      },
      include: {
        product: true
      }
    });

    res.status(201).json(returnRequest);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании запроса на возврат: ' + error.message });
  }
};

// Client: Get My Return Requests
export const getMyReturnRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const returnRequests = await prisma.returnRequest.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(returnRequests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении ваших возвратов: ' + error.message });
  }
};

// Admin: Get All Return Requests
export const getAllReturnRequests = async (req, res) => {
  try {
    const returnRequests = await prisma.returnRequest.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true
          }
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            totalAmount: true,
            clientName: true,
            clientPhone: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(returnRequests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении всех возвратов: ' + error.message });
  }
};

// Admin: Moderate Return Request (Approve/Reject)
export const updateReturnRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус модерации. Допустимы: approved, rejected.' });
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: parseInt(id) },
      include: { product: true }
    });

    if (!returnRequest) {
      return res.status(404).json({ error: 'Запрос на возврат не найден.' });
    }

    if (returnRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Этот запрос уже обработан.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.returnRequest.update({
        where: { id: parseInt(id) },
        data: {
          status,
          adminComment: adminComment || null
        },
        include: {
          product: true
        }
      });

      if (status === 'approved') {
        const order = await tx.order.findUnique({
          where: { id: returnRequest.orderId },
          include: { items: true },
        });

        if (order) {
          const orderItem = order.items.find(item => item.productId === returnRequest.productId);
          if (orderItem) {
            const itemTotal = orderItem.price * returnRequest.quantity;
            const subtotal = order.subtotalAmount || 1;
            const discount = order.discountAmount || 0;
            
            const itemPaidAmount = itemTotal - (discount * (itemTotal / subtotal));
            const deductAmount = Math.round(Math.max(0, itemPaidAmount) * 0.03);
            
            if (deductAmount > 0) {
              await tx.bonusTransaction.create({
                data: {
                  userId: returnRequest.userId,
                  orderId: returnRequest.orderId,
                  type: 'spent',
                  status: 'used',
                  amount: deductAmount,
                  description: `Списание кэшбека за возврат товара (${returnRequest.quantity} шт. ${returnRequest.product?.name || 'товар'}) по заказу #${returnRequest.orderId}`,
                },
              });
            }
          }
        }
      }

      return upd;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при модерации возврата: ' + error.message });
  }
};
