import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { sendEmail } from '../utils/email.js';
import redisClient from '../config/redis.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';


const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  address: user.address,
  role: user.role,
  supplierId: user.supplierId,
  supplierName: user.supplier?.name || null,
  isBlocked: user.isBlocked,
});

const checkPhoneExists = async (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 10) return false;
  const last10Digits = digits.slice(-10);

  const users = await prisma.user.findMany({
    where: {
      phone: { not: null }
    },
    select: { phone: true }
  });

  return users.some(u => {
    const uDigits = u.phone.replace(/[^\d]/g, '');
    return uDigits.length >= 10 && uDigits.slice(-10) === last10Digits;
  });
};

export const sendRegisterCode = async (req, res) => {
  const { email, password, name, phone, address } = req.body;

  if (!email || !password || !phone || !name) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля (Имя, Почта, Пароль, Телефон)' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Неверный формат электронной почты' });
  }

  // Validate phone format
  const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Неверный формат номера телефона. Используйте шаблон +7 (707) 123-45-67' });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
  }

  try {
    // Check if email already registered
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    // Check if phone already registered
    const phoneExists = await checkPhoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({ error: 'Пользователь с таким номером телефона уже зарегистрирован' });
    }

    // Check email spam lock in Redis
    const cleanEmail = email.trim().toLowerCase();
    const spamKey = `rate-limit:email-otp:${cleanEmail}`;
    const isSpam = await redisClient.exists(spamKey);
    if (isSpam) {
      return res.status(429).json({ error: 'Код подтверждения на эту почту уже отправлен. Пожалуйста, подождите 1 минуту перед повторным запросом.' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to database
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send email with code
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Регистрация на TORMAG.KZ</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Используйте код ниже для подтверждения адреса электронной почты при регистрации. Код действителен в течение 10 минут.</p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 11px;">Если вы не совершали регистрацию на нашем сайте, просто проигнорируйте это письмо.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Код подтверждения регистрации - TORMAG.KZ',
      html,
    });

    // Set lock in Redis only after email was sent successfully
    await redisClient.set(spamKey, '1', { EX: 60 });

    res.json({ message: 'Код подтверждения регистрации успешно отправлен на вашу почту.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при отправке кода подтверждения: ' + error.message });
  }
};

export const register = async (req, res) => {
  const { email, password, name, phone, address, code } = req.body;

  if (!email || !password || !phone || !name || !code) {
    return res.status(400).json({ error: 'Все поля, включая код подтверждения, обязательны' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Неверный формат электронной почты' });
  }

  // Validate phone format
  const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Неверный формат номера телефона. Используйте шаблон +7 (707) 123-45-67' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
  }

  try {
    // Verify registration OTP code
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, code },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Неверный код подтверждения регистрации' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'Срок действия кода подтверждения истек. Запросите новый код.' });
    }

    // Double check email and phone uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    const phoneExists = await checkPhoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({ error: 'Пользователь с таким номером телефона уже зарегистрирован' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address: address || null,
        role: 'CUSTOMER',
      },
      include: { supplier: true },
    });

    // Delete token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, supplierId: newUser.supplierId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);

    res.status(201).json({
      user: buildUserPayload(newUser),
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

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, supplierId: user.supplierId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);

    res.json({
      user: buildUserPayload(user),
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа: ' + error.message });
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Вы успешно вышли из системы.' });
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

    res.json(buildUserPayload(user));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения профиля: ' + error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Укажите email' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // For security reasons, don't disclose if user exists or not, but in B2B let's be explicit or return ok.
      // Let's return error since it helps users correct their typos
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }

    // Check email spam lock in Redis
    const cleanEmail = email.trim().toLowerCase();
    const spamKey = `rate-limit:email-otp:${cleanEmail}`;
    const isSpam = await redisClient.exists(spamKey);
    if (isSpam) {
      return res.status(429).json({ error: 'Код подтверждения на эту почту уже отправлен. Пожалуйста, подождите 1 минуту перед повторным запросом.' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save token to database (delete any old recovery tokens for this email first)
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send email using Resend utility
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Восстановление доступа TORMAG.KZ</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Вы запросили сброс пароля. Используйте код ниже для подтверждения операции. Код действителен в течение 10 минут.</p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 11px;">Если вы не совершали этот запрос, просто проигнорируйте это письмо.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Код для восстановления пароля - TORMAG.KZ',
      html,
    });

    // Set lock in Redis only after email was sent successfully
    await redisClient.set(spamKey, '1', { EX: 60 });

    res.json({ message: 'Код подтверждения успешно отправлен на вашу почту.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при отправке кода: ' + error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ error: 'Пожалуйста, укажите email, код и новый пароль' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Verify recovery code
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, code },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'Срок действия кода подтверждения истек. Запросите новый код.' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete token so it cannot be reused
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти в систему.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка смены пароля: ' + error.message });
  }
};

