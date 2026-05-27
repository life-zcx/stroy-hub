import prisma from '../config/db.js';
import { buildEvaluationContext } from './promotionController.js';
import { buildPromotionSnapshot, evaluatePromotion, normalizePromoCode } from '../utils/promotionUtils.js';

function getSupplierId(user) {
  const parsed = Number.parseInt(user?.supplierId, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildOrderItemsInclude(user) {
  const supplierId = user?.role === 'SUPPLIER' ? getSupplierId(user) : null;

  return {
    items: {
      ...(supplierId
        ? {
            where: {
              product: {
                supplierId,
              },
            },
          }
        : {}),
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
      },
    },
  };
}

export const createOrder = async (req, res) => {
  const { clientName, clientPhone, clientAddress, paymentMethod, items, promoCode } = req.body;

  if (!clientName || !clientPhone || !clientAddress || !paymentMethod || !items || !items.length) {
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

    const normalizedItems = [];

    for (const item of items) {
      const productId = Number.parseInt(item.productId, 10);
      const quantity = Number.parseInt(item.quantity, 10);

      if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'В заказе обнаружены некорректные позиции.' });
      }

      const product = existingProducts.find((entry) => entry.id === productId);
      if (!product) {
        return res.status(400).json({ error: 'Один из товаров не найден в базе данных.' });
      }

      normalizedItems.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    const evaluationContext = await buildEvaluationContext(normalizedItems);
    const subtotalAmount = evaluationContext.subtotalAmount;

    const normalizedPromoCode = normalizePromoCode(promoCode);
    let appliedPromotion = null;
    let discountAmount = 0;
    let finalTotalAmount = subtotalAmount;

    if (normalizedPromoCode) {
      appliedPromotion = await prisma.promotion.findUnique({
        where: { promoCode: normalizedPromoCode },
      });

      const evaluation = evaluatePromotion(appliedPromotion, evaluationContext);
      if (!evaluation.valid) {
        return res.status(400).json({ error: evaluation.error });
      }

      discountAmount = evaluation.discountAmount;
      finalTotalAmount = evaluation.totalAmount;
    }

    // 2. Perform transaction to ensure consistent writing of Order and OrderItems
    const result = await prisma.$transaction(async (tx) => {
      let reservedPromotion = null;
      let reservedEvaluation = null;

      if (appliedPromotion) {
        reservedPromotion = await tx.promotion.findUnique({
          where: { id: appliedPromotion.id },
        });

        reservedEvaluation = evaluatePromotion(reservedPromotion, evaluationContext);
        if (!reservedEvaluation.valid) {
          throw new Error(reservedEvaluation.error);
        }

        discountAmount = reservedEvaluation.discountAmount;
        finalTotalAmount = reservedEvaluation.totalAmount;
      }

      const order = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          clientAddress,
          paymentMethod,
          subtotalAmount,
          discountAmount,
          totalAmount: finalTotalAmount,
          promoCode: reservedPromotion?.promoCode || null,
          promotionTitle: reservedPromotion?.title || null,
          promotionId: reservedPromotion?.id || null,
          promotionSnapshot: buildPromotionSnapshot(reservedPromotion, reservedEvaluation),
          userId: parseInt(userId),
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
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

      if (reservedPromotion) {
        await tx.promotion.update({
          where: { id: reservedPromotion.id },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }

      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    const normalizedMessage = String(error.message || '').toLowerCase();
    const statusCode = normalizedMessage.includes('акци') || normalizedMessage.includes('промокод') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка создания заказа: ' + error.message });
  }
};

export const getAllOrders = async (req, res) => {
  const user = req.user;
  const where = {};
  const supplierId = getSupplierId(user);

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
    if (!supplierId) {
      return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
    }

    where.items = {
      some: {
        product: {
          supplierId
        }
      }
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: buildOrderItemsInclude(user),
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
  const supplierId = getSupplierId(req.user);

  if (!status) {
    return res.status(400).json({ error: 'Статус обязателен' });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Неверный статус заказа' });
  }

  try {
    if (req.user?.role === 'SUPPLIER' && !supplierId) {
      return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
    }

    const orderId = parseInt(id);
    const existing = req.user?.role === 'SUPPLIER'
      ? await prisma.order.findFirst({
          where: {
            id: orderId,
            items: {
              some: {
                product: {
                  supplierId,
                },
              },
            },
          },
        })
      : await prisma.order.findUnique({
          where: { id: orderId },
        });

    if (!existing) {
      return res.status(req.user?.role === 'SUPPLIER' ? 403 : 404).json({
        error: req.user?.role === 'SUPPLIER' ? 'Недостаточно прав для изменения этого заказа.' : 'Заказ не найден',
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: buildOrderItemsInclude(req.user)
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа: ' + error.message });
  }
};

export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const {
    status,
    cancellationReason,
    managerNotes,
    clientName,
    clientPhone,
    clientAddress,
    items,
  } = req.body;
  const supplierId = getSupplierId(req.user);

  try {
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'Неверный ID заказа' });
    }

    // Find the existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Check permissions for Supplier
    if (req.user?.role === 'SUPPLIER') {
      if (!supplierId) {
        return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      }

      const hasSupplierProducts = existingOrder.items.some(
        (item) => item.product.supplierId === supplierId
      );

      if (!hasSupplierProducts) {
        return res.status(403).json({ error: 'Недостаточно прав для изменения этого заказа.' });
      }
    }

    const updateData = {};
    if (status !== undefined) {
      const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Неверный статус заказа' });
      }
      updateData.status = status;
      if (status === 'cancelled' && cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      } else if (status !== 'cancelled') {
        updateData.cancellationReason = null;
      }
    }

    if (managerNotes !== undefined) updateData.managerNotes = managerNotes;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (clientAddress !== undefined) updateData.clientAddress = clientAddress;

    // Perform inside a transaction if we are editing items
    const result = await prisma.$transaction(async (tx) => {
      if (items !== undefined && Array.isArray(items)) {
        // Only Admin can modify order items
        if (req.user?.role !== 'ADMIN') {
          throw new Error('Только администратор может изменять состав заказа.');
        }

        if (items.length === 0) {
          throw new Error('Заказ не может быть пустым. Если вы хотите отменить заказ, измените его статус на Отменен.');
        }

        // 1. Verify products exist
        const productIds = items.map((item) => parseInt(item.productId, 10));
        const existingProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        if (existingProducts.length !== productIds.length) {
          throw new Error('Некоторые товары не найдены в базе данных.');
        }

        const normalizedItems = items.map((item) => {
          const product = existingProducts.find((p) => p.id === parseInt(item.productId, 10));
          return {
            productId: product.id,
            quantity: parseInt(item.quantity, 10),
            price: product.price,
          };
        });

        // Recalculate price details
        const evaluationContext = await buildEvaluationContext(normalizedItems);
        const subtotalAmount = evaluationContext.subtotalAmount;

        let discountAmount = 0;
        let finalTotalAmount = subtotalAmount;
        let promoCodeToUse = existingOrder.promoCode;
        let promotionIdToUse = existingOrder.promotionId;
        let promotionTitleToUse = existingOrder.promotionTitle;
        let promotionSnapshotToUse = existingOrder.promotionSnapshot;

        if (promoCodeToUse) {
          const promo = await tx.promotion.findUnique({
            where: { promoCode: promoCodeToUse },
          });

          if (promo) {
            const evaluation = evaluatePromotion(promo, evaluationContext);
            if (evaluation.valid) {
              discountAmount = evaluation.discountAmount;
              finalTotalAmount = evaluation.totalAmount;
              promotionSnapshotToUse = buildPromotionSnapshot(promo, evaluation);
            } else {
              promoCodeToUse = null;
              promotionIdToUse = null;
              promotionTitleToUse = null;
              promotionSnapshotToUse = null;
            }
          }
        }

        updateData.subtotalAmount = subtotalAmount;
        updateData.discountAmount = discountAmount;
        updateData.totalAmount = finalTotalAmount;
        updateData.promoCode = promoCodeToUse;
        updateData.promotionId = promotionIdToUse;
        updateData.promotionTitle = promotionTitleToUse;
        updateData.promotionSnapshot = promotionSnapshotToUse;

        // Delete old items
        await tx.orderItem.deleteMany({
          where: { orderId },
        });

        // Create new items
        await tx.orderItem.createMany({
          data: normalizedItems.map((item) => ({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }

      // Update the order itself
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: buildOrderItemsInclude(req.user),
      });

      return updatedOrder;
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка обновления заказа: ' + error.message });
  }
};
