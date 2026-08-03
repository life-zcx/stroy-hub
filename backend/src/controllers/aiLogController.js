import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const logAiChat = async (req, res) => {
  try {
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
