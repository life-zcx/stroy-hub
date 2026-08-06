import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const logAiChat = async (req, res) => {
  try {
    const expectedSecret = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || 'tormag_internal_secret';
    const incomingSecret = req.headers['x-internal-secret'];

    if (incomingSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Доступ запрещен. Требуется внутренний ключ безопасности.' });
    }

    const { prompt, reply, recommendedProdIds, userId } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    if (!prompt || !reply) {
      return res.status(400).json({ error: 'prompt и reply обязательны' });
    }

    const logEntry = await prisma.aiChatLog.create({
      data: {
        prompt,
        reply,
        recommendedProdIds: Array.isArray(recommendedProdIds) ? recommendedProdIds : [],
        ip: String(clientIp || '').substring(0, 45),
        userId: userId ? Number(userId) : null
      }
    });

    res.json({ success: true, logId: logEntry.id });
  } catch (error) {
    logger.error('[AI CHAT LOG ERROR]', error);
    res.status(500).json({ error: 'Ошибка сохранения лога ИИ' });
  }
};

export const getUserAiChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    const where = userId
      ? { userId: Number(userId) }
      : { ip: String(clientIp || '').substring(0, 45) };

    const logs = await prisma.aiChatLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json(logs);
  } catch (error) {
    logger.error('[GET AI CHAT HISTORY ERROR]', error);
    res.status(500).json({ error: 'Ошибка получения истории ИИ' });
  }
};
