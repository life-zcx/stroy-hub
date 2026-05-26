import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stroyhub_super_secret_jwt_key_2026';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Доступ запрещен. Отсутствует авторизационный токен.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Неверный формат токена. Используйте Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, email, role, supplierId
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
