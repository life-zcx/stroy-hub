import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (Array.isArray(ip)) {
    ip = ip[0];
  } else if (typeof ip === 'string') {
    ip = ip.split(',')[0].trim();
  }

  return ip || 'unknown';
}

export const registerRateLimiter = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next();
  }

  const ip = getClientIp(req);

  try {
    const key = `rate-limit:register-emails:${ip}`;
    
    // Add email to the set of attempted registration emails from this IP
    const added = await redisClient.sAdd(key, email);
    
    // Get unique email count attempted from this IP
    const uniqueEmailsCount = await redisClient.sCard(key);
    
    // If it's the first element in the set, set 60 seconds expiration
    if (uniqueEmailsCount === 1 && added === 1) {
      await redisClient.expire(key, 60);
    }

    // Limit to 5 unique emails per minute
    if (uniqueEmailsCount > 5) {
      return res.status(429).json({
        error: 'Превышен лимит уникальных регистраций. Слишком много попыток с разными email-адресами с вашего IP. Пожалуйста, попробуйте через минуту.'
      });
    }

    next();
  } catch (error) {
    console.error('[Rate Limiter Error]', error);
    // Fail-safe approach: do not block registration if Redis is temporarily unavailable
    next();
  }
};

export const loginRateLimiter = async (req, res, next) => {
  const ip = getClientIp(req);

  try {
    const key = `rate-limit:login-attempts:${ip}`;
    
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 60);
    }

    if (count > 10) {
      return res.status(429).json({
        error: 'Слишком много попыток входа с вашего IP. Пожалуйста, попробуйте войти через минуту.'
      });
    }

    next();
  } catch (error) {
    console.error('[Login Rate Limiter Error]', error);
    next();
  }
};

export const estimateUploadRateLimiter = async (req, res, next) => {
  const actor = req.user?.id ? `user:${req.user.id}` : `ip:${getClientIp(req)}`;

  try {
    const key = `rate-limit:estimate-upload:${actor}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 10 * 60);
    }

    if (count > 30) {
      return res.status(429).json({
        error: 'Слишком много загрузок смет. Пожалуйста, попробуйте снова через 10 минут.',
      });
    }

    next();
  } catch (error) {
    console.error('[Estimate Rate Limiter Error]', error);
    res.status(503).json({ error: 'Сервис временно недоступен. Попробуйте позже.' });
  }
};


// Global rate limiter: 200 requests per minute per IP
// Applied to all API routes as a first line of defence against bots and abuse.
export const globalRateLimiter = async (req, res, next) => {
  const ip = getClientIp(req);

  try {
    const key = `rate-limit:global:${ip}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 60);
    }

    if (count > 200) {
      logger.warn(`[Global Rate Limit] IP ${ip} exceeded 200 req/min`);
      return res.status(429).json({
        error: 'Слишком много запросов. Пожалуйста, попробуйте через минуту.',
      });
    }

    next();
  } catch (error) {
    // Fail-open: do not block users if Redis is temporarily unavailable
    logger.error('[Global Rate Limiter Error]', error);
    next();
  }
};

