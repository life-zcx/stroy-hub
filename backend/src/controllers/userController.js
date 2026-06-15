import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { getUserLoyaltyStatus } from '../utils/loyaltyUtils.js';
import { getAvailableBalance, getPendingBalance } from './bonusController.js';

const ALLOWED_ROLES = ['ADMIN', 'SUPPLIER', 'CUSTOMER'];

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  address: user.address,
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

const ensureSupplierExists = async (supplierId) => {
  if (!supplierId) {
    return null;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  return supplier;
};

const ensureNotLastActiveAdmin = async (userId) => {
  const otherActiveAdmins = await prisma.user.count({
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
    const users = await prisma.user.findMany({
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
    res.status(500).json({ error: 'Ошибка получения пользователей: ' + error.message });
  }
};

export const createUserByAdmin = async (req, res) => {
  const { email, password, name, phone, address, role = 'CUSTOMER', supplierId } = req.body;

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
        supplierId: role === 'SUPPLIER' ? parsedSupplierId : null,
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
    res.status(500).json({ error: 'Ошибка создания пользователя: ' + error.message });
  }
};

export const updateUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { email, name, phone, address, role, supplierId } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { supplier: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    if (role && role !== existingUser.role) {
      const roleError = validateRole(role);
      if (roleError) {
        return res.status(400).json({ error: roleError });
      }

      if (req.user.id === userId && role !== 'ADMIN') {
        return res.status(400).json({ error: 'Нельзя снять роль администратора у самого себя.' });
      }

      if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
        const hasBackupAdmin = await ensureNotLastActiveAdmin(userId);
        if (!hasBackupAdmin) {
          return res.status(400).json({ error: 'Нельзя понизить последнего активного администратора.' });
        }
      }
    }

    if (email && email !== existingUser.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует.' });
      }
    }

    const nextRole = role || existingUser.role;
    const parsedSupplierId = parseSupplierId(supplierId);

    if (nextRole === 'SUPPLIER') {
      if (!parsedSupplierId) {
        return res.status(400).json({ error: 'Для роли поставщика нужно выбрать склад.' });
      }

      const supplier = await ensureSupplierExists(parsedSupplierId);
      if (!supplier) {
        return res.status(400).json({ error: 'Указанный склад не найден.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email ?? existingUser.email,
        name: name === undefined ? existingUser.name : (name || null),
        phone: phone === undefined ? existingUser.phone : (phone || null),
        address: address === undefined ? existingUser.address : (address || null),
        role: nextRole,
        supplierId: nextRole === 'SUPPLIER' ? parsedSupplierId : null,
      },
      include: {
        supplier: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления пользователя: ' + error.message });
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

    res.json({ message: 'Пароль пользователя обновлен.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления пароля: ' + error.message });
  }
};

export const updateUserBlockStatus = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { isBlocked } = req.body;

  if (typeof isBlocked !== 'boolean') {
    return res.status(400).json({ error: 'Нужно передать флаг блокировки.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        supplier: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }

    if (req.user.id === userId && isBlocked) {
      return res.status(400).json({ error: 'Нельзя заблокировать самого себя.' });
    }

    if (existingUser.role === 'ADMIN' && isBlocked) {
      const hasBackupAdmin = await ensureNotLastActiveAdmin(userId);
      if (!hasBackupAdmin) {
        return res.status(400).json({ error: 'Нельзя заблокировать последнего активного администратора.' });
      }
    }

    const updatedUser = await prisma.user.update({
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

    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка изменения статуса блокировки: ' + error.message });
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

    const loyalty = await getUserLoyaltyStatus(userId);
    const availableBalance = await getAvailableBalance(userId);
    const pendingBalance = await getPendingBalance(userId);

    const earnedAgg = await prisma.bonusTransaction.aggregate({
      where: { userId, type: { in: ['earned', 'manual'] }, status: { in: ['available', 'used'] } },
      _sum: { amount: true },
    });
    const spentAgg = await prisma.bonusTransaction.aggregate({
      where: { userId, type: 'spent', status: 'used' },
      _sum: { amount: true },
    });

    const totalEarned = earnedAgg._sum.amount || 0;
    const totalSpent = spentAgg._sum.amount || 0;

    const orders = await prisma.order.findMany({
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
    });

    const allOrders = await prisma.order.findMany({
      where: { userId },
      select: {
        status: true,
        totalAmount: true,
        paymentMethod: true,
      },
    });

    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const totalSpentMoney = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedCount = completedOrders.length;
    const cancelledCount = allOrders.filter(o => o.status === 'cancelled').length;
    const avgOrderValue = completedCount > 0 ? Math.round(totalSpentMoney / completedCount) : 0;

    const paymentMethods = allOrders.map(o => o.paymentMethod);
    const methodCounts = paymentMethods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    let favoritePaymentMethod = 'Не определен';
    let maxCount = 0;
    for (const [method, count] of Object.entries(methodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoritePaymentMethod = method;
      }
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
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
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения портрета пользователя: ' + error.message });
  }
};

