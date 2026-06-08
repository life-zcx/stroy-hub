import redisClient from '../config/redis.js';

export const registerRateLimiter = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next();
  }

  // Get client IP address (taking proxy headers into account)
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (Array.isArray(ip)) {
    ip = ip[0];
  } else if (typeof ip === 'string') {
    ip = ip.split(',')[0].trim();
  }

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
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (Array.isArray(ip)) {
    ip = ip[0];
  } else if (typeof ip === 'string') {
    ip = ip.split(',')[0].trim();
  }

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


