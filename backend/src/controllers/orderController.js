import prisma from '../config/db.js';
import { applyRetailPricingToProduct, readPricingSettings } from './productController.js';
import { evaluatePromotion } from '../utils/promotionUtils.js';
import { buildEvaluationContext } from './promotionController.js';
import { buildPromotionSnapshot } from '../utils/promotionUtils.js';
import { prepareOrderItemsAndPricing } from '../services/orderPricingService.js';
import { calculateOrderBonusDiscount, recordOrderBonusTransactions, handleOrderStatusBonusUpdates } from '../services/orderBonusService.js';
import { triggerOrderCreatedNotifications, triggerOrderStatusChangedNotification } from '../services/orderNotificationService.js';

function getSupplierId(user) {
  const parsed = Number.parseInt(user?.supplierId, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildOrderItemsInclude(user) {
  const supplierId = user?.role === 'SUPPLIER' ? getSupplierId(user) : null;
  return {
    items: {
      ...(supplierId ? { where: { product: { supplierId } } } : {}),
      include: {
        product: {
          include: { supplier: true },
        },
      },
    },
  };
}

function buildOrderWhere(user) {
  const where = {};
  const supplierId = getSupplierId(user);

  if (user.role === 'CUSTOMER') {
    where.userId = user.id;
  } else if (user.role === 'SUPPLIER') {
    where.items = { some: { product: { supplierId } } };
  } else if (user.role === 'ADMIN') {
    // Admin sees all orders
  } else {
    where.userId = user.id || -1;
  }
  return where;
}

function createStatusHistoryEntry(status, changedAt = new Date()) {
  return { status, changedAt: changedAt.toISOString() };
}

function buildStatusHistory(existingOrder, nextStatus) {
  const currentHistory = Array.isArray(existingOrder.statusHistory)
    ? existingOrder.statusHistory
    : [createStatusHistoryEntry(existingOrder.status || 'pending', existingOrder.createdAt || new Date())];

  if (existingOrder.status === nextStatus) return currentHistory;
  return [...currentHistory, createStatusHistoryEntry(nextStatus)];
}

// Create a new Order
export const createOrder = async (req, res) => {
  const { clientName, clientPhone, clientAddress, paymentMethod, items, promoCode, useBonuses, deliveryDate, deliveryTime, comment, companyName, companyBin } = req.body;

  if (!clientName || !clientPhone || !clientAddress || !paymentMethod || !items || !items.length) {
    return res.status(400).json({ error: 'Все поля заказа и товары обязательны' });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Для оформления заказа необходимо войти в систему' });
  }

  try {
    const { normalizedItems, subtotalAmount, evaluationContext, appliedPromotion } = await prepareOrderItemsAndPricing(items, promoCode);

    const result = await prisma.$transaction(async (tx) => {
      let reservedPromotion = null;
      let reservedEvaluation = null;
      let discountAmount = 0;
      let finalTotalAmount = subtotalAmount;

      if (appliedPromotion) {
        reservedPromotion = await tx.promotion.findUnique({
          where: { id: appliedPromotion.id },
        });

        if (!reservedPromotion || !reservedPromotion.isActive) {
          throw new Error('Указанный промокод неактивен или не существует.');
        }

        if (reservedPromotion.isFirstOrderOnly) {
          const existingOrdersCount = await tx.order.count({
            where: { userId: parseInt(userId), status: { not: 'cancelled' } },
          });
          if (existingOrdersCount > 0) {
            throw new Error('Этот промокод действует только на первый заказ.');
          }
        }

        if (reservedPromotion.maxUsagePerUser != null) {
          const userPromoUsageCount = await tx.order.count({
            where: { userId: parseInt(userId), promotionId: reservedPromotion.id, status: { not: 'cancelled' } },
          });
          if (userPromoUsageCount >= reservedPromotion.maxUsagePerUser) {
            throw new Error('Вы уже использовали этот промокод максимальное количество раз.');
          }
        }

        reservedEvaluation = evaluatePromotion(reservedPromotion, evaluationContext);
        if (!reservedEvaluation.valid) {
          throw new Error(reservedEvaluation.error);
        }

        discountAmount = reservedEvaluation.discountAmount;
        finalTotalAmount = reservedEvaluation.totalAmount;
      }

      // Calculate bonus discount before creating order record
      const { bonusDiscount, updatedTotalAmount, loyalty } = await calculateOrderBonusDiscount(
        userId,
        useBonuses,
        finalTotalAmount,
        tx
      );

      finalTotalAmount = updatedTotalAmount;
      discountAmount += bonusDiscount;

      const order = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          clientAddress,
          paymentMethod,
          companyName: companyName || null,
          companyBin: companyBin || null,
          subtotalAmount,
          discountAmount,
          totalAmount: finalTotalAmount,
          usedBonusPoints: bonusDiscount,
          promoCode: reservedPromotion?.promoCode || null,
          promotionTitle: reservedPromotion?.title || null,
          promotionId: reservedPromotion?.id || null,
          promotionSnapshot: buildPromotionSnapshot(reservedPromotion, reservedEvaluation),
          statusHistory: [createStatusHistoryEntry('pending')],
          userId: parseInt(userId, 10),
          deliveryDate: deliveryDate || null,
          deliveryTime: deliveryTime || null,
          managerNotes: null,
          clientComment: comment || null,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              selectedOption: item.selectedOption || null,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Record spent & earned bonus transactions with the valid created order.id
      await recordOrderBonusTransactions(
        userId,
        order.id,
        bonusDiscount,
        subtotalAmount,
        finalTotalAmount,
        normalizedItems,
        loyalty,
        tx
      );

      if (reservedPromotion) {
        await tx.promotion.update({
          where: { id: reservedPromotion.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      return order;
    });

    triggerOrderCreatedNotifications(result);
    res.status(201).json(result);
  } catch (error) {
    const normalizedMessage = String(error.message || '').toLowerCase();
    const statusCode = normalizedMessage.includes('акци') || normalizedMessage.includes('промокод') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка создания заказа: ' + error.message });
  }
};

// Get all orders (paginated)
export const getAllOrders = async (req, res) => {
  const user = req.user;
  const supplierId = getSupplierId(user);

  if (!user) {
    return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
  }

  if (user.role === 'SUPPLIER' && !supplierId) {
    return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
  }

  try {
    const { status, search, sort } = req.query;
    const where = buildOrderWhere(user);

    if (status && status !== 'all') where.status = status;

    if (search) {
      const q = search.toLowerCase().trim();
      const OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { clientPhone: { contains: q, mode: 'insensitive' } },
        { clientAddress: { contains: q, mode: 'insensitive' } },
      ];
      const parsedId = parseInt(q, 10);
      if (!isNaN(parsedId)) OR.push({ id: parsedId });
      where.AND = [...(where.AND || []), { OR }];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'date_asc') orderBy = { createdAt: 'asc' };
    else if (sort === 'amount_desc') orderBy = { totalAmount: 'desc' };
    else if (sort === 'amount_asc') orderBy = { totalAmount: 'asc' };

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10) || 20), 100);
    const summaryOnly = req.query.summary === 'true';

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        ...(summaryOnly
          ? {
              include: {
                _count: { select: { items: true } },
                returnRequests: { select: { id: true, status: true, quantity: true, productId: true } },
              },
            }
          : {
              include: { ...buildOrderItemsInclude(user), returnRequests: true },
            }),
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка заказов: ' + error.message });
  }
};

// Get order details by ID
export const getOrderById = async (req, res) => {
  const user = req.user;
  const supplierId = getSupplierId(user);
  const orderId = Number.parseInt(req.params.id, 10);

  if (!user) return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
  if (Number.isNaN(orderId)) return res.status(400).json({ error: 'Неверный ID заказа' });
  if (user.role === 'SUPPLIER' && !supplierId) return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });

  try {
    const order = await prisma.order.findFirst({
      where: { ...buildOrderWhere(user), id: orderId },
      include: buildOrderItemsInclude(user),
    });

    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    if (user.role === 'CUSTOMER' && order.items) {
      const productIds = order.items.map((item) => item.productId);
      const reviews = await prisma.review.findMany({
        where: { userId: user.id, productId: { in: productIds } },
        select: { productId: true },
      });
      const reviewedProductIds = new Set(reviews.map((r) => r.productId));

      order.items = order.items.map((item) => ({
        ...item,
        isReviewed: reviewedProductIds.has(item.productId),
      }));
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заказа: ' + error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const supplierId = getSupplierId(req.user);

  if (!status) return res.status(400).json({ error: 'Статус обязателен' });
  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Неверный статус заказа' });

  try {
    if (req.user?.role === 'SUPPLIER' && !supplierId) {
      return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
    }

    const orderId = parseInt(id);
    const existing = req.user?.role === 'SUPPLIER'
      ? await prisma.order.findFirst({
          where: { id: orderId, items: { some: { product: { supplierId } } } },
        })
      : await prisma.order.findUnique({ where: { id: orderId } });

    if (!existing) {
      return res.status(req.user?.role === 'SUPPLIER' ? 403 : 404).json({
        error: req.user?.role === 'SUPPLIER' ? 'Недостаточно прав для изменения этого заказа.' : 'Заказ не найден',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status, statusHistory: buildStatusHistory(existing, status) },
        include: buildOrderItemsInclude(req.user),
      });

      await handleOrderStatusBonusUpdates(orderId, existing.userId, status, tx);
      return order;
    });

    triggerOrderStatusChangedNotification(updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа: ' + error.message });
  }
};

// Update order details (Admin/Supplier)
export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, cancellationReason, managerNotes, clientComment, clientName, clientPhone, clientAddress, items, discountAmount, companyName, companyBin } = req.body;
  const supplierId = getSupplierId(req.user);

  try {
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) return res.status(400).json({ error: 'Неверный ID заказа' });

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!existingOrder) return res.status(404).json({ error: 'Заказ не найден' });

    if (req.user?.role === 'SUPPLIER') {
      if (!supplierId) return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      const hasSupplierProducts = existingOrder.items.some((item) => item.product.supplierId === supplierId);
      if (!hasSupplierProducts) return res.status(403).json({ error: 'Недостаточно прав для изменения этого заказа.' });
    }

    const updateData = {};
    if (status !== undefined) {
      const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Неверный статус заказа' });
      updateData.status = status;
      updateData.statusHistory = buildStatusHistory(existingOrder, status);
      updateData.cancellationReason = status === 'cancelled' && cancellationReason ? cancellationReason : null;
    }

    if (managerNotes !== undefined) updateData.managerNotes = managerNotes;
    if (clientComment !== undefined) updateData.clientComment = clientComment;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (clientAddress !== undefined) updateData.clientAddress = clientAddress;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyBin !== undefined) updateData.companyBin = companyBin;

    if (discountAmount !== undefined && items === undefined) {
      const manualDiscount = parseFloat(discountAmount) || 0;
      updateData.discountAmount = manualDiscount;
      updateData.totalAmount = Math.max(0, existingOrder.subtotalAmount - manualDiscount);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (items !== undefined && Array.isArray(items)) {
        if (req.user?.role !== 'ADMIN') {
          throw new Error('Только администратор может изменять состав заказа.');
        }
        if (items.length === 0) {
          throw new Error('Заказ не может быть пустым. Если вы хотите отменить заказ, измените его статус на Отменен.');
        }

        const uniqueProductIds = [...new Set(items.map((item) => parseInt(item.productId, 10)).filter(Boolean))];
        const rawProducts = await tx.product.findMany({ where: { id: { in: uniqueProductIds } } });
        if (rawProducts.length !== uniqueProductIds.length) throw new Error('Некоторые товары не найдены в базе данных.');

        const settings = readPricingSettings();
        const allCats = await tx.category.findMany();
        const categoryMap = new Map(allCats.map((c) => [c.id, c]));
        const categorySlugMap = new Map(allCats.map((c) => [c.slug, c]));
        const existingProducts = rawProducts.map((p) => applyRetailPricingToProduct(p, settings, categoryMap, categorySlugMap));

        let normalizedItems = items.map((item) => {
          const product = existingProducts.find((p) => p.id === parseInt(item.productId, 10));
          let itemPrice = product.price;
          const selectedOption = item.selectedOption ? String(item.selectedOption).trim() : null;
          if (selectedOption && product.options && typeof product.options === 'object') {
            const opts = product.options;
            if (Array.isArray(opts.items)) {
              const matchedOpt = opts.items.find((o) => o.value === selectedOption);
              if (matchedOpt && matchedOpt.price && !isNaN(parseFloat(matchedOpt.price))) {
                itemPrice = parseFloat(matchedOpt.price);
              }
            }
          }
          if (item.price && !isNaN(parseFloat(item.price))) itemPrice = parseFloat(item.price);
          return { productId: product.id, quantity: parseInt(item.quantity, 10), price: itemPrice, selectedOption };
        });

        const evaluationContext = await buildEvaluationContext(normalizedItems);
        normalizedItems = evaluationContext.items.map((item, idx) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          selectedOption: normalizedItems[idx]?.selectedOption || null,
        }));
        const subtotalAmount = evaluationContext.subtotalAmount;

        let finalDiscount = 0;
        let promoCodeToUse = existingOrder.promoCode;
        let promotionIdToUse = existingOrder.promotionId;
        let promotionTitleToUse = existingOrder.promotionTitle;
        let promotionSnapshotToUse = existingOrder.promotionSnapshot;

        if (discountAmount !== undefined) {
          finalDiscount = parseFloat(discountAmount) || 0;
        } else if (promoCodeToUse) {
          const promo = await tx.promotion.findUnique({ where: { promoCode: promoCodeToUse } });
          if (promo) {
            const evaluation = evaluatePromotion(promo, evaluationContext);
            if (evaluation.valid) {
              finalDiscount = evaluation.discountAmount;
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
        updateData.discountAmount = finalDiscount;
        updateData.totalAmount = Math.max(0, subtotalAmount - finalDiscount);
        updateData.promoCode = promoCodeToUse;
        updateData.promotionId = promotionIdToUse;
        updateData.promotionTitle = promotionTitleToUse;
        updateData.promotionSnapshot = promotionSnapshotToUse;

        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.orderItem.createMany({
          data: normalizedItems.map((item) => ({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            selectedOption: item.selectedOption || null,
          })),
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: buildOrderItemsInclude(req.user),
      });

      if (status !== undefined) {
        await handleOrderStatusBonusUpdates(orderId, existingOrder.userId, status, tx);
      }

      return updatedOrder;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа: ' + error.message });
  }
};
