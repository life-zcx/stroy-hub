import bcrypt from 'bcryptjs';
import { safeErrorMessage } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { sendEmail } from '../utils/email.js';
import redisClient from '../config/redis.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';
import { sendTelegramAlert } from '../utils/telegram.js';
import { normalizePhone } from '../utils/phoneUtils.js';
import logger from '../utils/logger.js';
import { generateUniqueReferralCode } from '../services/referralService.js';
import { readSystemSettingsAsync } from './settingsController.js';

const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  address: user.address,
  addresses: user.addresses || [],
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
});

const checkPhoneExists = async (phone) => {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 10) return false;

  const last10Digits = normalized.slice(-10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phoneNormalized: normalized },
        { phoneNormalized: { endsWith: last10Digits } },
        { phone: phone }
      ]
    },
    select: { id: true }
  });
  return Boolean(existing);
};

export const sendRegisterCode = async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    address,
    entityType,
    companyBin,
    companyName,
    directorName,
    legalAddress,
    organizationType,
  } = req.body;

  if (!email || !password || !phone || !name) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля (Имя, Почта, Пароль, Телефон)' });
  }

  if (entityType === 'LEGAL') {
    if (!companyBin || !companyName || !directorName || !legalAddress || !organizationType) {
      return res.status(400).json({ error: 'Пожалуйста, заполните все данные юридического лица (БИН/ИИН, Наименование, ФИО руководителя, Юридический адрес, Тип организации)' });
    }
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

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`🔑 [DEV REGISTRATION OTP CODE] Email: ${email} | Code: ${code}`);
    }

    try {
      await sendEmail({
        to: email,
        subject: 'Код подтверждения регистрации - TORMAG.KZ',
        html,
      });
    } catch (mailErr) {
      if (process.env.NODE_ENV === 'production') {
        logger.error(`Production email sending failed for ${email}: ${mailErr.message}`);
        throw mailErr;
      }
      logger.warn(`Email sending failed for ${email} (${mailErr.message}), fallback to logged OTP code in dev console.`);
    }

    // Set lock in Redis only after code is generated and logged
    await redisClient.set(spamKey, '1', { EX: 60 });

    res.json({ message: 'Код подтверждения регистрации успешно отправлен на вашу почту.' });
  } catch (error) {
    logger.error('Error sending registration OTP code:', error);
    res.status(500).json({ error: 'Ошибка при отправке кода подтверждения: ' + (error.message || '') });
  }
};

export const register = async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    address,
    code,
    sessionId,
    entityType,
    companyBin,
    companyName,
    directorName,
    legalAddress,
    organizationType,
  } = req.body;

  if (!email || !password || !phone || !name || !code) {
    return res.status(400).json({ error: 'Все поля, включая код подтверждения, обязательны' });
  }

  if (entityType === 'LEGAL') {
    if (!companyBin || !companyName || !directorName || !legalAddress || !organizationType) {
      return res.status(400).json({ error: 'Пожалуйста, заполните все данные юридического лица' });
    }
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
    const cleanEmail = email.trim().toLowerCase();
    const attemptsKey = `fail-attempts:register:${cleanEmail}`;
    const attempts = await redisClient.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= 5) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Регистрация аннулирована. Запросите новый код.' });
    }

    // Verify registration OTP code
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, code },
    });

    if (!resetToken) {
      const currentAttempts = await redisClient.incr(attemptsKey);
      if (currentAttempts === 1) {
        await redisClient.expire(attemptsKey, 600); // 10 minutes
      }
      if (currentAttempts >= 5) {
        await prisma.passwordResetToken.deleteMany({ where: { email } });
        return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Регистрация аннулирована. Запросите новый код.' });
      }
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

    // Check optional referral code
    let referredById = null;
    if (req.body.referralCode && typeof req.body.referralCode === 'string') {
      const cleanRefCode = req.body.referralCode.trim().toUpperCase();
      const referrerUser = await prisma.user.findUnique({
        where: { referralCode: cleanRefCode },
        select: { id: true },
      });
      if (referrerUser) {
        referredById = referrerUser.id;
      }
    }

    const newReferralCode = await generateUniqueReferralCode();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        phoneNormalized: normalizePhone(phone),
        address: address || null,
        entityType: entityType || 'PHYSICAL',
        companyBin: companyBin || null,
        companyName: companyName || null,
        directorName: directorName || null,
        legalAddress: legalAddress || null,
        organizationType: organizationType || null,
        role: 'CUSTOMER',
        referralCode: newReferralCode,
        referredById: referredById,
      },
      include: { supplier: true },
    });

    // Credit Welcome Bonus (referral bonus from settings, or standard welcome bonus)
    try {
      const sysSettings = await readSystemSettingsAsync();
      if (referredById) {
        const refBonusAmount = sysSettings.referralBonusAmount ?? 500;
        if (refBonusAmount > 0) {
          await prisma.bonusTransaction.create({
            data: {
              userId: newUser.id,
              type: 'manual',
              status: 'available',
              amount: refBonusAmount,
              description: 'Приветственный бонус по приглашению друга',
            },
          });
          logger.info(`Credited ${refBonusAmount} KZT referral welcome bonus to user #${newUser.id}`);
        }
      } else {
        if (sysSettings.welcomeBonusEnabled && sysSettings.welcomeBonusAmount > 0) {
          await prisma.bonusTransaction.create({
            data: {
              userId: newUser.id,
              type: 'manual',
              status: 'available',
              amount: sysSettings.welcomeBonusAmount,
              description: sysSettings.welcomeBonusTitle || 'Приветственный бонус при регистрации',
            },
          });
          logger.info(`Credited ${sysSettings.welcomeBonusAmount} KZT welcome bonus from system settings to user #${newUser.id}`);
        }
      }
    } catch (bonusErr) {
      logger.error('Error crediting welcome bonus on registration:', bonusErr);
    }

    // Delete token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    await redisClient.del(attemptsKey);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, supplierId: newUser.supplierId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setAuthCookie(req, res, token);

    if (sessionId) {
      Promise.all([
        prisma.analyticsEvent.updateMany({
          where: { sessionId, userId: null },
          data: { userId: newUser.id }
        }),
        prisma.pageView.updateMany({
          where: { sessionId, userId: null },
          data: { userId: newUser.id }
        })
      ]).catch(err => logger.warn('Error linking session events on register', { error: err.message }));
    }

    res.status(201).json({
      user: buildUserPayload(newUser),
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при регистрации: '  });
  }
};

export const login = async (req, res) => {
  const { email, password, sessionId } = req.body;

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
    setAuthCookie(req, res, token);

    // Send Telegram alert on admin/supplier login
    if (user.role === 'ADMIN' || user.role === 'SUPPLIER') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const text = `🔑 *[Вход в систему]*\n\n👤 *Пользователь:* \`${user.email}\` (${user.name || 'без имени'})\n🛡️ *Роль:* \`${user.role}\`\n🌐 *IP-адрес:* \`${ip}\`\n🖥️ *User-Agent:* \`${userAgent}\``;
      sendTelegramAlert(text).catch(err => logger.warn('Error sending Telegram alert on login', { error: err.message }));
    }

    if (sessionId) {
      Promise.all([
        prisma.analyticsEvent.updateMany({
          where: { sessionId, userId: null },
          data: { userId: user.id }
        }),
        prisma.pageView.updateMany({
          where: { sessionId, userId: null },
          data: { userId: user.id }
        })
      ]).catch(err => logger.warn('Error linking session events on login', { error: err.message }));
    }

    res.json({
      user: buildUserPayload(user),
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа: '  });
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(req, res);
  res.json({ message: 'Вы успешно вышли из системы.' });
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.json(null);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { supplier: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(buildUserPayload(user));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения профиля: '  });
  }
};

export const updateProfile = async (req, res) => {
  const {
    name,
    phone,
    address,
    addresses,
    oldPassword,
    newPassword,
    entityType,
    companyBin,
    companyName,
    directorName,
    legalAddress,
    organizationType,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Optional phone validation and normalization if phone is provided
    let processedPhone = phone;
    if (processedPhone && typeof processedPhone === 'string' && processedPhone.trim()) {
      let rawDigits = processedPhone.replace(/[^\d]/g, '');
      if (rawDigits.length === 11 && (rawDigits.startsWith('8') || rawDigits.startsWith('7'))) {
        const last10 = rawDigits.slice(1);
        processedPhone = `+7 (${last10.slice(0,3)}) ${last10.slice(3,6)}-${last10.slice(6,8)}-${last10.slice(8,10)}`;
        rawDigits = '7' + last10;
      }

      const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
      if (!phoneRegex.test(processedPhone)) {
        return res.status(400).json({ error: 'Неверный формат номера телефона. Используйте шаблон +7 (707) 123-45-67' });
      }

      // Check if phone is already taken by another user
      const last10Digits = rawDigits.slice(-10);
      const otherMatched = await prisma.$queryRaw`
        SELECT id FROM "User" 
        WHERE "id" != ${req.user.id}
          AND "phone" IS NOT NULL 
          AND RIGHT(REGEXP_REPLACE("phone", '[^\d]', '', 'g'), 10) = ${last10Digits}
        LIMIT 1
      `;
      if (otherMatched.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким номером телефона уже зарегистрирован' });
      }
    }

    let hashedPassword = undefined;
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Для смены пароля необходимо указать текущий пароль' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: processedPhone !== undefined ? processedPhone : undefined,
        phoneNormalized: processedPhone ? normalizePhone(processedPhone) : undefined,
        address: address !== undefined ? address : undefined,
        addresses: addresses !== undefined ? addresses : undefined,
        password: hashedPassword !== undefined ? hashedPassword : undefined,
        entityType: entityType !== undefined ? entityType : undefined,
        companyBin: companyBin !== undefined ? companyBin : undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        directorName: directorName !== undefined ? directorName : undefined,
        legalAddress: legalAddress !== undefined ? legalAddress : undefined,
        organizationType: organizationType !== undefined ? organizationType : undefined,
      },
      include: { supplier: true }
    });

    res.json(buildUserPayload(updatedUser));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления профиля: '  });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Укажите email' });
  }

  try {
    // Check email spam lock in Redis (before DB lookup to avoid user enumeration)
    const cleanEmail = email.trim().toLowerCase();
    const spamKey = `rate-limit:email-otp:${cleanEmail}`;
    const isSpam = await redisClient.exists(spamKey);
    if (isSpam) {
      return res.status(429).json({ error: 'Код подтверждения на эту почту уже отправлен. Пожалуйста, подождите 1 минуту перед повторным запросом.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // NOTE: We intentionally do NOT return a 404 if the user is not found.
    // Revealing whether an email is registered or not is a User Enumeration vulnerability.
    // Instead, we silently return 200 OK in both cases.
    if (user) {
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

      if (process.env.NODE_ENV !== 'production') {
        logger.info(`🔑 [DEV PASSWORD RESET OTP CODE] Email: ${email} | Code: ${code}`);
      }

      try {
        await sendEmail({
          to: email,
          subject: 'Код для восстановления пароля - TORMAG.KZ',
          html,
        });
      } catch (mailErr) {
        if (process.env.NODE_ENV === 'production') {
          logger.error(`Production password reset email failed for ${email}: ${mailErr.message}`);
          throw mailErr;
        }
        logger.warn(`Email sending failed for ${email} (${mailErr.message}), fallback to logged OTP code in dev console.`);
      }

      // Set lock in Redis
      await redisClient.set(spamKey, '1', { EX: 60 });
    }

    // Always return the same response to prevent user enumeration
    res.json({ message: 'Если этот email зарегистрирован, вы получите код подтверждения.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при отправке кода: '  });
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

    const cleanEmail = email.trim().toLowerCase();
    const attemptsKey = `fail-attempts:reset-password:${cleanEmail}`;
    const attempts = await redisClient.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= 5) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Восстановление аннулировано. Запросите код заново.' });
    }

    // Verify recovery code
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email, code },
    });

    if (!resetToken) {
      const currentAttempts = await redisClient.incr(attemptsKey);
      if (currentAttempts === 1) {
        await redisClient.expire(attemptsKey, 600); // 10 minutes
      }
      if (currentAttempts >= 5) {
        await prisma.passwordResetToken.deleteMany({ where: { email } });
        return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Восстановление аннулировано. Запросите код заново.' });
      }
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
    await redisClient.del(attemptsKey);

    res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти в систему.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка смены пароля: '  });
  }
};

export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Укажите email и код подтверждения' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    const attemptsKey = `fail-attempts:reset-password:${cleanEmail}`;
    const attempts = await redisClient.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= 5) {
      await prisma.passwordResetToken.deleteMany({ where: { email: cleanEmail } });
      return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Восстановление аннулировано. Запросите код заново.' });
    }

    // Verify recovery code in database
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email: cleanEmail, code: cleanCode },
    });

    if (!resetToken) {
      const currentAttempts = await redisClient.incr(attemptsKey);
      if (currentAttempts === 1) {
        await redisClient.expire(attemptsKey, 600); // 10 minutes
      }
      if (currentAttempts >= 5) {
        await prisma.passwordResetToken.deleteMany({ where: { email: cleanEmail } });
        return res.status(429).json({ error: 'Слишком много неверных попыток ввода кода. Восстановление аннулировано. Запросите код заново.' });
      }
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'Срок действия кода подтверждения истек. Запросите новый код.' });
    }

    res.json({ message: 'Код подтверждения верен' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки кода: '  });
  }
};

export const deleteAccount = async (req, res) => {
  const { reason } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Пользователь не авторизован' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const anonymizedPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    const anonymizedName = `Удаленный аккаунт #${userId}`;
    const anonymizedEmail = `deleted_${userId}_${Date.now()}@deleted.tormag.kz`;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
          password: anonymizedPassword,
          phone: null,
          phoneNormalized: null,
          address: null,
          addresses: null,
          companyBin: null,
          companyName: null,
          directorName: null,
          legalAddress: null,
          organizationType: null,
          isDeleted: true,
          deletionReason: reason || 'Не указана',
          deletedAt: new Date(),
        },
      });
    } catch (updateErr) {
      logger.warn(`Prisma update failed with isDeleted field (${updateErr.message}), trying fallback...`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
          password: anonymizedPassword,
          phone: null,
          phoneNormalized: null,
          address: null,
          addresses: null,
          companyBin: null,
          companyName: null,
          directorName: null,
          legalAddress: null,
          organizationType: null,
        },
      });

      await prisma.$executeRaw`
        UPDATE "User" 
        SET "isDeleted" = true, 
            "deletionReason" = ${reason || 'Не указана'}, 
            "deletedAt" = NOW() 
        WHERE "id" = ${userId}
      `.catch(() => {});
    }

    // Clean up Redis session cache & password tokens
    try {
      await redisClient.del(`user:session:${userId}`);
      if (user.email) {
        await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });
      }
    } catch (cleanErr) {
      logger.warn(`Session cleanup warning on user #${userId} deletion: ${cleanErr.message}`);
    }

    clearAuthCookie(req, res);
    logger.info(`User #${userId} deleted account. Reason: ${reason || 'Not specified'}`);

    res.json({ message: 'Учетная запись успешно удалена.' });
  } catch (error) {
    logger.error(`Error deleting user #${req.user?.id}: ${error.message}`);
    res.status(500).json({ error: 'Ошибка при удалении учетной записи: '  });
  }
};



