// Updated Prisma schema bindings for User entity fields
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import { getUserLoyaltyStatus } from '../utils/loyaltyUtils.js';
import { getAvailableBalance, getPendingBalance } from './bonusController.js';
import { safeErrorMessage } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const ALLOWED_ROLES = ['ADMIN', 'SUPPLIER', 'CUSTOMER'];

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  address: user.address,
  entityType: user.entityType || 'PHYSICAL',
  companyBin: user.companyBin || null,
  companyName: user.companyName || null,
  directorName: user.directorName || null,
  legalAddress: user.legalAddress || null,
  organizationType: user.organizationType || null,
  role: user.role,
  supplierId: user.supplierId,
  supplierName: user.supplier?.name || null,
  isBlocked: user.isBlocked,
  blockedAt: user.blockedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  orderCount: user._count?.orders || 0,
});

const parseSupplierId = (supplierId) => {
  if (supplierId === '' || supplierId === null || supplierId === undefined) {
    return null;
  }

  return parseInt(supplierId, 10);
};

const validateRole = (role) => {
  if (!ALLOWED_ROLES.includes(role)) {
    return 'Указана недопустимая роль.';
  }

  return null;
};

const ensureSupplierExists = async (supplierId, dbClient = prisma) => {
  if (!supplierId) {
    return null;
  }

  const supplier = await dbClient.supplier.findUnique({
    where: { id: supplierId },
  });

  return supplier;
};

const ensureNotLastActiveAdmin = async (userId, dbClient = prisma) => {
  const otherActiveAdmins = await dbClient.user.count({
    where: {
      role: 'ADMIN',
      isBlocked: false,
      NOT: { id: userId },
    },
  });

  return otherActiveAdmins > 0;
};

export const getAllUsers = async (req, res) => {
  try {
    const isAll = req.query.all === 'true';
    if (isAll) {
      const users = await prisma.user.findMany({
        include: {
          supplier: true,
          _count: { select: { orders: true } },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      });
      return res.json(users.map(serializeUser));
    }

    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20)) : null;

    const role = req.query.role;
    const search = req.query.search;
    const status = req.query.status;

    const where = {};
    if (role && role !== 'ALL') where.role = role;
    if (status === 'ACTIVE') where.isBlocked = false;
    if (status === 'BLOCKED') where.isBlocked = true;

    if (search) {
      const q = search.toLowerCase().trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { companyBin: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          include: {
            supplier: true,
            _count: { select: { orders: true } },
          },
          orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return res.json({
        data: users.map(serializeUser),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        supplier: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(users.map(serializeUser));
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения пользователей.') });
  }
};

export const createUserByAdmin = async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    address,
    role = 'CUSTOMER',
    supplierId,
    entityType,
    companyBin,
    companyName,
    directorName,
    legalAddress,
    organizationType,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
  }

  const roleError = validateRole(role);
  if (roleError) {
    return res.status(400).json({ error: roleError });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует.' });
    }

    const parsedSupplierId = parseSupplierId(supplierId);

    if (role === 'SUPPLIER') {
      if (!parsedSupplierId) {
        return res.status(400).json({ error: 'Для роли поставщика нужно выбрать склад.' });
      }

      const supplier = await ensureSupplierExists(parsedSupplierId);
      if (!supplier) {
        return res.status(400).json({ error: 'Указанный склад не найден.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        address: address || null,
        role,
        supplier: role === 'SUPPLIER' && parsedSupplierId ? { connect: { id: parsedSupplierId } } : undefined,
        entityType: entityType || 'PHYSICAL',
        companyBin: entityType === 'LEGAL' ? (companyBin || null) : null,
        companyName: entityType === 'LEGAL' ? (companyName || null) : null,
        directorName: entityType === 'LEGAL' ? (directorName || null) : null,
        legalAddress: entityType === 'LEGAL' ? (legalAddress || null) : null,
        organizationType: entityType === 'LEGAL' ? (organizationType || null) : null,
      },
      include: {
        supplier: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    res.status(201).json(serializeUser(createdUser));
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка создания пользователя.') });
  }
};

export const updateUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const {
    email,
    name,
    phone,
    address,
    role,
    supplierId,
    entityType,
    companyBin,
    companyName,
    directorName,
    legalAddress,
    organizationType,
  } = req.body;

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        include: { supplier: true },
      });

      if (!existingUser) {
        const err = new Error('Пользователь не найден.');
        err.statusCode = 404;
        throw err;
      }

      if (role && role !== existingUser.role) {
        const roleError = validateRole(role);
        if (roleError) {
          const err = new Error(roleError);
          err.statusCode = 400;
          throw err;
        }

        if (req.user.id === userId && role !== 'ADMIN') {
          const err = new Error('Нельзя снять роль администратора у самого себя.');
          err.statusCode = 400;
          throw err;
        }

        if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
          const hasBackupAdmin = await ensureNotLastActiveAdmin(userId, tx);
          if (!hasBackupAdmin) {
            const err = new Error('Нельзя понизить последнего активного администратора.');
            err.statusCode = 400;
            throw err;
          }
        }
      }

      if (email && email !== existingUser.email) {
        const userWithSameEmail = await tx.user.findUnique({
          where: { email },
        });

        if (userWithSameEmail) {
          const err = new Error('Пользователь с таким email уже существует.');
          err.statusCode = 400;
          throw err;
        }
      }

      const nextRole = role || existingUser.role;
      const parsedSupplierId = parseSupplierId(supplierId);

      if (nextRole === 'SUPPLIER') {
        if (!parsedSupplierId) {
          const err = new Error('Для роли поставщика нужно выбрать склад.');
          err.statusCode = 400;
          throw err;
        }

        const supplier = await ensureSupplierExists(parsedSupplierId, tx);
        if (!supplier) {
          const err = new Error('Указанный склад не найден.');
          err.statusCode = 400;
          throw err;
        }
      }

      return await tx.user.update({
        where: { id: userId },
        data: {
          email: email ?? existingUser.email,
          name: name === undefined ? existingUser.name : (name || null),
          phone: phone === undefined ? existingUser.phone : (phone || null),
          address: address === undefined ? existingUser.address : (address || null),
          role: nextRole,
          supplier: nextRole === 'SUPPLIER' && parsedSupplierId ? { connect: { id: parsedSupplierId } } : { disconnect: true },
          entityType: entityType !== undefined ? entityType : undefined,
          companyBin: companyBin !== undefined ? companyBin : undefined,
          companyName: companyName !== undefined ? companyName : undefined,
          directorName: directorName !== undefined ? directorName : undefined,
          legalAddress: legalAddress !== undefined ? legalAddress : undefined,
          organizationType: organizationType !== undefined ? organizationType : undefined,
        },
        include: {
          supplier: true,
          _count: {
            select: { orders: true },
          },
        },
      });
    });

    await redisClient.del(`user:session:${userId}`).catch(() => {});
    res.json(serializeUser(updatedUser));
  } catch (error) {
    const status = error.statusCode || 500;
    // error.message here comes from our own custom errors (role validation, not-found)
    // which are safe to expose. But in production we still wrap unknown ones.
    const message = error.statusCode ? error.message : safeErrorMessage(error, 'Ошибка обновления пользователя.');
    res.status(status).json({ error: message });
  }
};

export const updateUserPassword = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await redisClient.del(`user:session:${userId}`).catch(() => {});
    res.json({ message: 'Пароль пользователя обновлен.' });
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка обновления пароля.') });
  }
};

export const updateUserBlockStatus = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { isBlocked } = req.body;

  if (typeof isBlocked !== 'boolean') {
    return res.status(400).json({ error: 'Нужно передать флаг блокировки.' });
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        include: {
          supplier: true,
          _count: {
            select: { orders: true },
          },
        },
      });

      if (!existingUser) {
        const err = new Error('Пользователь не найден.');
        err.statusCode = 404;
        throw err;
      }

      if (req.user.id === userId && isBlocked) {
        const err = new Error('Нельзя заблокировать самого себя.');
        err.statusCode = 400;
        throw err;
      }

      if (existingUser.role === 'ADMIN' && isBlocked) {
        const hasBackupAdmin = await ensureNotLastActiveAdmin(userId, tx);
        if (!hasBackupAdmin) {
          const err = new Error('Нельзя заблокировать последнего активного администратора.');
          err.statusCode = 400;
          throw err;
        }
      }

      return await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked,
          blockedAt: isBlocked ? new Date() : null,
        },
        include: {
          supplier: true,
          _count: {
            select: { orders: true },
          },
        },
      });
    });

    await redisClient.del(`user:session:${userId}`).catch(() => {});
    res.json(serializeUser(updatedUser));
  } catch (error) {
    const status = error.statusCode || 500;
    const message = error.statusCode ? error.message : safeErrorMessage(error, 'Ошибка изменения статуса блокировки.');
    res.status(status).json({ error: message });
  }
};

export const getUserPortrait = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        supplier: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const [
      loyalty,
      availableBalance,
      pendingBalance,
      earnedAgg,
      spentAgg,
      orders,
      allOrders,
      cartItems,
      recentlyViewed,
      recentSearches,
      bonusTransactions,
    ] = await Promise.all([
      getUserLoyaltyStatus(userId),
      getAvailableBalance(userId),
      getPendingBalance(userId),
      prisma.bonusTransaction.aggregate({
        where: { userId, type: { in: ['earned', 'manual', 'referral_earned'] }, status: { in: ['available', 'used'] } },
        _sum: { amount: true },
      }),
      prisma.bonusTransaction.aggregate({
        where: { userId, type: 'spent', status: 'used' },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId },
        select: {
          status: true,
          totalAmount: true,
          paymentMethod: true,
        },
      }),
      prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: { id: true, name: true, price: true, image: true, category: true }
          }
        }
      }),
      prisma.analyticsEvent.findMany({
        where: { userId, type: 'product_view', productId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          product: {
            select: { id: true, name: true, price: true, image: true, category: true }
          }
        }
      }),
      prisma.analyticsEvent.findMany({
        where: { userId, type: 'search', searchQuery: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { searchQuery: true, createdAt: true }
      }),
      prisma.bonusTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          order: {
            select: { id: true, totalAmount: true }
          }
        }
      })
    ]);

    const totalEarned = earnedAgg._sum.amount || 0;
    const totalSpent = spentAgg._sum.amount || 0;

    const completedOrdersList = allOrders.filter(o => o.status === 'completed');
    const cancelledOrdersList = allOrders.filter(o => o.status === 'cancelled');
    const completedCount = completedOrdersList.length;
    const cancelledCount = cancelledOrdersList.length;
    const totalSpentMoney = completedOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = completedCount > 0 ? Math.round(totalSpentMoney / completedCount) : 0;

    const paymentMethodCounts = {};
    allOrders.forEach(o => {
      if (o.paymentMethod) {
        paymentMethodCounts[o.paymentMethod] = (paymentMethodCounts[o.paymentMethod] || 0) + 1;
      }
    });
    let favoritePaymentMethod = 'Неизвестно';
    let maxCount = 0;
    Object.entries(paymentMethodCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoritePaymentMethod = method;
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        entityType: user.entityType || 'PHYSICAL',
        companyBin: user.companyBin || null,
        companyName: user.companyName || null,
        directorName: user.directorName || null,
        legalAddress: user.legalAddress || null,
        organizationType: user.organizationType || null,
        role: user.role,
        supplierName: user.supplier?.name || null,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
      loyalty,
      bonuses: {
        available: Math.round(availableBalance),
        pending: Math.round(pendingBalance),
        totalEarned: Math.round(totalEarned),
        totalSpent: Math.round(totalSpent),
      },
      stats: {
        totalOrders: allOrders.length,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
        totalSpent: Math.round(totalSpentMoney),
        avgOrderValue,
        favoritePaymentMethod,
      },
      recentOrders: orders,
      cart: cartItems.filter(c => c.product).map(c => ({
        id: c.product.id,
        name: c.product.name,
        price: c.product.price,
        image: c.product.image,
        category: c.product.category,
        quantity: c.quantity,
        addedAt: c.updatedAt,
      })),
      recentlyViewed: recentlyViewed.filter(rv => rv.product).map(rv => ({
        id: rv.product.id,
        name: rv.product.name,
        price: rv.product.price,
        image: rv.product.image,
        category: rv.product.category,
        viewedAt: rv.createdAt,
      })),
      recentSearches: recentSearches.map(rs => ({
        query: rs.searchQuery,
        searchedAt: rs.createdAt,
      })),
      bonusTransactions: bonusTransactions.map(bt => ({
        id: bt.id,
        orderId: bt.orderId,
        orderAmount: bt.order?.totalAmount || null,
        type: bt.type,
        status: bt.status,
        amount: bt.amount,
        description: bt.description,
        createdAt: bt.createdAt
      })),
    });
  } catch (error) {
    logger.error('[GET USER PORTRAIT ERROR]', { error: error.message, userId });
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения портрета пользователя.') });
  }
};

// Add or increment item in user's cart (admin view)
export const addUserCartItem = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { productId, quantity } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const prodId = parseInt(productId, 10);

  if (isNaN(prodId)) {
    return res.status(400).json({ error: 'Некорректный ID товара.' });
  }

  try {
    // Verify user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: prodId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден.' });
    }

    // Add or increment cart item safely
    const existingCartItem = await prisma.cartItem.findFirst({
      where: { userId, productId: prodId }
    });

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + qty }
      });
    } else {
      await prisma.cartItem.create({
        data: { userId, productId: prodId, quantity: qty }
      });
    }

    // Return the updated cart items formatted
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, price: true, image: true, category: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(cartItems.filter(c => c.product).map(c => ({
      id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      image: c.product.image,
      category: c.product.category,
      quantity: c.quantity,
      addedAt: c.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка при добавлении товара в корзину.') });
  }
};

// Update item quantity in user's cart (admin view)
export const updateUserCartItem = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const productId = parseInt(req.params.productId, 10);
  const { quantity } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Некорректный ID товара.' });
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  try {
    await prisma.cartItem.updateMany({
      where: { userId, productId },
      data: { quantity: qty }
    });

    // Return updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, price: true, image: true, category: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(cartItems.filter(c => c.product).map(c => ({
      id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      image: c.product.image,
      category: c.product.category,
      quantity: c.quantity,
      addedAt: c.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка при обновлении количества товара в корзине.') });
  }
};

// Remove item from user's cart (admin view)
export const removeUserCartItem = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Некорректный ID товара.' });
  }

  try {
    await prisma.cartItem.deleteMany({
      where: { userId, productId }
    });

    // Return updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, price: true, image: true, category: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(cartItems.filter(c => c.product).map(c => ({
      id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      image: c.product.image,
      category: c.product.category,
      quantity: c.quantity,
      addedAt: c.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка при удалении товара из корзины.') });
  }
};

// Clear user's cart (admin view)
export const clearUserCart = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  try {
    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    res.json({ success: true, message: 'Корзина успешно очищена' });
  } catch (error) {
    res.status(500).json({ error: safeErrorMessage(error, 'Ошибка при очистке корзины пользователя.') });
  }
};


