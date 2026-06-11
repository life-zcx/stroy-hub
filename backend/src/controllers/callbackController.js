import prisma from '../config/db.js';
import { sanitizeOptionalText, sanitizePersonName, sanitizePhone } from '../utils/requestValidation.js';
import { sendCallbackAlert } from '../utils/telegramBot.js';

export const createCallback = async (req, res) => {
  const { userName, userPhone } = req.body;

  if (!userName || !userPhone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }

  try {
    const safeName = sanitizePersonName(userName, 'Ваше имя');
    const safePhone = sanitizePhone(userPhone, 'Телефон');

    const callback = await prisma.callbackRequest.create({
      data: {
        userName: safeName,
        userPhone: safePhone,
        status: 'pending',
      },
    });

    // Send Telegram Notification asynchronously
    sendCallbackAlert(callback).catch(err => console.error('[TELEGRAM ALERT ERROR] Callback:', err));

    res.status(201).json(callback);
  } catch (error) {
    const statusCode = error.message.includes('Поле') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка при создании заявки: ' + error.message });
  }
};

export const getAllCallbacks = async (req, res) => {
  try {
    const callbacks = await prisma.callbackRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(callbacks);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заявок: ' + error.message });
  }
};

export const updateCallback = async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  const validStatuses = ['pending', 'completed', 'rejected'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус заявки.' });
  }

  try {
    const safeComment = comment === undefined
      ? undefined
      : sanitizeOptionalText(comment, 'Комментарий менеджера', 1000);

    const updated = await prisma.callbackRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        comment: safeComment,
      },
    });
    res.json(updated);
  } catch (error) {
    const statusCode = error.message.includes('Поле') || error.message.includes('Недопустимый') ? 400 : 500;
    res.status(statusCode).json({ error: 'Ошибка при обновлении заявки: ' + error.message });
  }
};
