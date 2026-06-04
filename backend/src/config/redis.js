import { createClient } from 'redis';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('[REDIS ERROR]', err);
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
