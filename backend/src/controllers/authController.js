import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stroyhub_super_secret_jwt_key_2026';

export const register = async (req, res) => {
  const { email, password, name, phone, address, role, supplierId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        address: address || null,
        role: role || 'CUSTOMER',
        supplierId: supplierId ? parseInt(supplierId) : null
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, supplierId: newUser.supplierId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        supplierId: newUser.supplierId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при регистрации: ' + error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Укажите email и пароль' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { supplier: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, supplierId: user.supplierId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        supplierId: user.supplierId,
        supplierName: user.supplier?.name || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа: ' + error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { supplier: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      supplierId: user.supplierId,
      supplierName: user.supplier?.name || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения профиля: ' + error.message });
  }
};
