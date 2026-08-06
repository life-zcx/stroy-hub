import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { getTokenFromRequest } from '../utils/authCookie.js';

function getUserIdFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return Number.isInteger(decoded.id) ? decoded.id : null;
  } catch (error) {
    return null;
  }
}

export const aiProxyHandler = async (req, res) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5005';
  const targetUrl = `${aiServiceUrl}/api/ai${req.url}`;
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (parseErr) {
      logger.error(`[AI PROXY ERROR] Non-JSON response from ${aiServiceUrl}${req.originalUrl} (HTTP ${response.status}): ${textData.substring(0, 200)}`);
      return res.status(response.status >= 400 ? response.status : 502).json({
        error: 'ИИ-сервис вернул некорректный ответ. Перезапустите контейнер tormag_ai_service.'
      });
    }

    if (response.ok && (req.url === '/chat' || req.originalUrl.includes('/chat')) && data && data.reply) {
      const promptText = req.body?.message || req.body?.prompt || '';
      if (promptText) {
        const userId = getUserIdFromToken(req);
        const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
        const recommendedProdIds = Array.isArray(data.recommendedProducts)
          ? data.recommendedProducts.map(p => typeof p === 'object' ? p.id : p).filter(id => Number.isInteger(id))
          : [];

        prisma.aiChatLog.create({
          data: {
            prompt: String(promptText),
            reply: String(data.reply),
            recommendedProdIds,
            ip: String(clientIp || '').substring(0, 45),
            userId: userId ? Number(userId) : null
          }
        }).catch(err => {
          logger.error('[AI CHAT DB LOG ERROR]', { error: err.message });
        });
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      logger.error(`[AI PROXY TIMEOUT] Request to ${aiServiceUrl}${req.originalUrl} timed out after 15s`);
      return res.status(504).json({ error: 'Превышено время ожидания ответа от ИИ-сервиса.' });
    }
    logger.error(`[AI PROXY ERROR] Failed to proxy to ${aiServiceUrl}: ${err.message}`);
    return res.status(502).json({ error: 'Сервис ИИ временно недоступен' });
  }
};
