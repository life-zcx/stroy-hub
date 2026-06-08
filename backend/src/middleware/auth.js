import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { getTokenFromRequest } from '../utils/authCookie.js';

export const verifyToken = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Доступ запрещен. Отсутствует авторизационный токен.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { supplier: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      supplierId: user.supplierId,
      supplierName: user.supplier?.name || null,
      isBlocked: user.isBlocked,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Токен недействителен или срок его действия истек.' });
  }
};

export const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Пользователь не аутентифицирован.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для выполнения операции.' });
    }

    next();
  };
};
