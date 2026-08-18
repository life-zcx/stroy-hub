import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

// IPs that bypass globalRateLimiter (internal Docker services, health-checkers, etc.)
// Extend via INTERNAL_IPS env var: comma-separated list of IPs/CIDRs
const INTERNAL_IPS = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  ...(process.env.INTERNAL_IPS ? process.env.INTERNAL_IPS.split(',').map(s => s.trim()) : []),
]);

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress;
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
    logger.error('[Register Rate Limiter Error] Redis failure', { error: error.message });
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
    logger.error('[Login Rate Limiter Error] Redis failure during authentication rate limit check', { error, ip });
    return res.status(503).json({ error: 'Сервис авторизации временно недоступен. Попробуйте повторить попытку позже.' });
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
    logger.error('[Estimate Rate Limiter Error] Redis failure', { error: error.message });
    res.status(503).json({ error: 'Сервис временно недоступен. Попробуйте позже.' });
  }
};

export const passwordResetRateLimiter = async (req, res, next) => {
  const ip = getClientIp(req);

  try {
    const key = `rate-limit:password-reset:${ip}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 15 * 60); // 15 минут
    }

    if (count > 5) {
      logger.warn(`[Password Reset Rate Limit] IP ${ip} exceeded 5 attempts in 15m`);
      return res.status(429).json({
        error: 'Слишком много попыток сброса пароля. Пожалуйста, повторите через 15 минут.'
      });
    }

    next();
  } catch (error) {
    logger.error('[Password Reset Rate Limiter Error] Redis failure', { error: error.message });
    next();
  }
};



// Global rate limiter
// Applied to all API routes as a first line of defence against bots and abuse.
// Internal IPs (Docker services, health checkers) are whitelisted and bypass it.
export const globalRateLimiter = async (req, res, next) => {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  // Whitelist: internal IPs skip the global limiter entirely
  const ip = getClientIp(req);
  if (INTERNAL_IPS.has(ip)) {
    return next();
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const defaultLimit = isDev ? 5000 : 300;
  const maxLimit = parseInt(process.env.GLOBAL_RATE_LIMIT, 10) || defaultLimit;

  try {
    const key = `rate-limit:global:${ip}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 60);
    }

    if (count > maxLimit) {
      logger.warn(`[Global Rate Limit] IP ${ip} exceeded ${maxLimit} req/min`);
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

// ─────────────────────────────────────────────────────────────────────────────
// User-ID based rate limiter
// Solves the NAT/VPN problem: counts per authenticated user, not per IP.
// Falls back to IP if the user is not authenticated.
// ─────────────────────────────────────────────────────────────────────────────
export const userRateLimiter = (maxRequests = 300, windowSeconds = 60) =>
  async (req, res, next) => {
    if (process.env.DISABLE_RATE_LIMIT === 'true') return next();

    // Use userId when available; fall back to IP
    const actor = req.user?.id ? `user:${req.user.id}` : `ip:${getClientIp(req)}`;

    try {
      const key = `rate-limit:user:${actor}`;
      const count = await redisClient.incr(key);
      if (count === 1) await redisClient.expire(key, windowSeconds);

      if (count > maxRequests) {
        logger.warn(`[User Rate Limit] ${actor} exceeded ${maxRequests} req/${windowSeconds}s`);
        return res.status(429).json({
          error: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
        });
      }
      next();
    } catch (error) {
      logger.error('[User Rate Limiter Error]', { error: error.message });
      next(); // fail-open
    }
  };

// ─────────────────────────────────────────────────────────────────────────────
// Heavy query rate limiter
// For endpoints that trigger expensive DB work (analytics, catalog with filters,
// product import). Much stricter than the global 300 req/min.
// ─────────────────────────────────────────────────────────────────────────────
export const heavyQueryRateLimiter = async (req, res, next) => {
  if (process.env.DISABLE_RATE_LIMIT === 'true') return next();

  const actor = req.user?.id ? `user:${req.user.id}` : `ip:${getClientIp(req)}`;

  try {
    const key = `rate-limit:heavy:${actor}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, 60);

    if (count > 30) {
      logger.warn(`[Heavy Query Rate Limit] ${actor} exceeded 30 heavy req/min`);
      return res.status(429).json({
        error: 'Слишком много тяжёлых запросов. Пожалуйста, подождите минуту.',
      });
    }
    next();
  } catch (error) {
    logger.error('[Heavy Query Rate Limiter Error]', { error: error.message });
    next(); // fail-open
  }
};

// Analytics rate limiter
// Applied specifically to public analytics ingest endpoints (/page-view, /event).
// Stricter than the global limiter: 60 events per IP per minute.
export const analyticsRateLimiter = async (req, res, next) => {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  const ip = getClientIp(req);

  try {
    const key = `rate-limit:analytics:${ip}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 60);
    }

    if (count > 60) {
      logger.warn(`[Analytics Rate Limit] IP ${ip} exceeded 60 analytics events/min`);
      return res.status(429).json({
        error: 'Слишком много запросов аналитики. Пожалуйста, попробуйте через минуту.',
      });
    }

    next();
  } catch (error) {
    // Fail-open: analytics is non-critical, do not block traffic if Redis is down
    logger.error('[Analytics Rate Limiter Error]', error);
    next();
  }
};
