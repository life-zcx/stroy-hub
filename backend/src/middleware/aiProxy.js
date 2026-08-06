import logger from '../utils/logger.js';

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
