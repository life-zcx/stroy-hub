import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { getTokenFromRequest } from '../utils/authCookie.js';
import redisClient from '../config/redis.js';

export const verifyToken = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Доступ запрещен. Отсутствует авторизационный токен.' });
  }

  // SEC-009: Проверка JWT blacklist (logout, принудительный revoke)
  try {
    const isBlacklisted = await redisClient.exists(`jwt:bl:${token.slice(-32)}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Сессия завершена. Войдите заново.' });
    }
  } catch {
    // Redis недоступен — продолжаем без blacklist (fail-open, как и rate limiter)
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    const sessionKey = `user:session:${decoded.id}`;

    try {
      const cached = await redisClient.get(sessionKey);
      if (cached) {
        user = JSON.parse(cached);
      }
    } catch {}

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { supplier: true },
      });

      if (user) {
        try {
          await redisClient.set(sessionKey, JSON.stringify(user), { EX: 60 });
        } catch {}
      }
    }

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

export const optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      let user = null;
      const sessionKey = `user:session:${decoded.id}`;

      try {
        const cached = await redisClient.get(sessionKey);
        if (cached) {
          user = JSON.parse(cached);
        }
      } catch {}

      if (!user) {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, supplierId: true, isBlocked: true, isDeleted: true },
        });
      }

      if (user && !user.isBlocked && !user.isDeleted) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          supplierId: user.supplierId,
        };
      }
    }
  } catch {}

  next();
};


