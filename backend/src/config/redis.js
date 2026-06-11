import { createClient } from 'redis';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

let lastRedisErrorTime = 0;
const REDIS_ERROR_ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

redisClient.on('error', (err) => {
  // Always log to stdout/stderr for Docker logs diagnostics
  console.error('[REDIS ERROR]', err);

  const now = Date.now();
  if (now - lastRedisErrorTime > REDIS_ERROR_ALERT_COOLDOWN) {
    lastRedisErrorTime = now;
    logger.error(`[REDIS ERROR] ${err.message}`, {
      code: err.code,
      syscall: err.syscall,
      address: err.address,
      port: err.port
    });
  }
});

redisClient.on('connect', () => {
  logger.info('Успешно подключено к Redis');
});

// Автоматическое подключение
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Ошибка инициализации подключения к Redis:', err);
  }
})();

export default redisClient;
