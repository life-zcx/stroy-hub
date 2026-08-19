import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

// Routes imports
import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import callbackRoutes from './routes/callbackRoutes.js';
import userRoutes from './routes/userRoutes.js';
import partnerRequestRoutes from './routes/partnerRequestRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import bonusRoutes from './routes/bonusRoutes.js';
import returnRequestRoutes from './routes/returnRequestRoutes.js';
import warrantyRuleRoutes from './routes/warrantyRuleRoutes.js';
import ogRoutes from './routes/ogRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import aiLogRoutes from './routes/aiLogRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import referralRoutes from './routes/referralRoutes.js';


// Middlewares & Controllers imports
import { handleIpxImageRequest } from './middleware/ipxOptimizer.js';
import { getDynamicSitemap } from './controllers/sitemapController.js';
import { getGoogleMerchantFeed } from './controllers/feedController.js';
import { globalRateLimiter, heavyQueryRateLimiter, userRateLimiter } from './middleware/rateLimiter.js';
import { aiProxyHandler } from './middleware/aiProxy.js';
import {
  handleProductOgPrerender,
  handleCatalogOgPrerender,
  handleStaticOgPrerender
} from './middleware/seoPrerender.js';

// Configuration & Utilities imports
import logger from './utils/logger.js';
import { startCleanupScheduler } from './utils/cleanup.js';
import { startTelegramBotListener } from './utils/telegramBot.js';
import prisma from './config/db.js';
import redisClient from './config/redis.js';
import { validateEnvironment } from './config/envCheck.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  origin(origin, callback) {
    if (!origin || (!isProduction && allowedOrigins.length === 0) || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS'));
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security & Parsing Middlewares
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'same-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // NOTE: 'unsafe-inline' is kept for style/script compatibility with the SPA framework.
        // 'unsafe-eval' has been REMOVED — it was previously allowing arbitrary code execution.
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
// NOTE: Helmet already sets HSTS via the hsts option above.
// Additional security headers not covered by Helmet:
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Response Error Interceptor for 500 status masking in Production
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500) {
      const errorMsg = body && typeof body === 'object' && body.error ? body.error : JSON.stringify(body);
      logger.error(`[HTTP 500] ${req.method} ${req.originalUrl}: ${errorMsg}`, {
        ip: req.ip || req.socket?.remoteAddress,
        userId: req.user?.id || null,
        method: req.method,
        url: req.originalUrl,
      });

      if (isProduction && body && typeof body === 'object' && 'error' in body) {
        return originalJson({ error: 'Внутренняя ошибка сервера.' });
      }
    }
    return originalJson(body);
  };
  next();
});

// Dynamic Image Optimization & Static Assets
app.get('/_ipx/*', handleIpxImageRequest);
app.get('/api/img', handleIpxImageRequest);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Bot Scanner Probe filter helper
const BOT_PROBE_REGEX = /(\.env|\.git|\.bak|\.sql|\.ini|\.yml|\.yaml|\.pem|\.p12|\.php|\.xml|wp-config|aws_credentials|db_credentials|swagger|openapi|sms-sender|finchat|keystore|secrets|sendgrid|mailgun|smtp)/i;

const isBotProbe404 = (req, statusCode) => {
  if (statusCode !== 404) return false;
  const url = req.originalUrl || req.url || '';
  const pathOnly = url.split('?')[0];
  if (BOT_PROBE_REGEX.test(pathOnly)) return true;
  if (
    pathOnly.startsWith('/api/env') ||
    pathOnly.startsWith('/api/config') ||
    pathOnly.startsWith('/api/auth/') ||
    pathOnly === '/api/upload' ||
    pathOnly.startsWith('/api/docs') ||
    pathOnly === '/api/secrets.txt' ||
    pathOnly === '/api/backup.sql'
  ) {
    return true;
  }
  return false;
};

// Request Logging
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/healthz') return next();
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const ip = req.ip || req.socket?.remoteAddress || '-';
    const userId = req.user?.id || null;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;
    const meta = { ip, userId, method: req.method, url: req.originalUrl, status: res.statusCode, durationMs };

    if (res.statusCode >= 500) {
      logger.error(message, meta);
    } else if (res.statusCode >= 400) {
      if (isBotProbe404(req, res.statusCode)) {
        logger.debug(message, meta);
      } else {
        logger.warn(message, meta);
      }
    } else {
      logger.info(message, meta);
    }
  });
  next();
});

// SEO Pre-rendering for Crawlers & Bots
app.get('/product/:id', handleProductOgPrerender);
app.get('/catalog/:slug', handleCatalogOgPrerender);
app.get('/:page(services|about|delivery|promotions|partners|faq|warranty|payment-terms|delivery-terms|requisites)', handleStaticOgPrerender);

// Feeds & Sitemap
app.get('/sitemap.xml', getDynamicSitemap);
app.get('/feed/google.xml', getGoogleMerchantFeed);
app.get('/api/feed/google.xml', getGoogleMerchantFeed);

// API Gateway & Service Routers
app.use('/api', globalRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);

// Heavy endpoints: strict limiter (30 req/min) — expensive DB queries
app.use('/api/products', heavyQueryRateLimiter, productRoutes);
app.use('/api/analytics', analyticsRoutes); // analytics routes have own limiters

// User-scoped routes: count per userId (not IP) — prevents NAT/VPN collisions
app.use('/api/orders', userRateLimiter(120, 60), orderRoutes);
app.use('/api/users', userRateLimiter(100, 60), userRoutes);
app.use('/api/cart', userRateLimiter(200, 60), cartRoutes);
app.use('/api/bonuses', userRateLimiter(60, 60), bonusRoutes);

// Standard API routes
app.use('/api/categories', categoryRoutes);
app.use('/api/callbacks', callbackRoutes);
app.use('/api/partner-requests', partnerRequestRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/banners', bannerRoutes);

app.use('/api/brands', brandRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/returns', returnRequestRoutes);
app.use('/api/warranty-rules', warrantyRuleRoutes);
app.use('/api/og', ogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/ai-logs', aiLogRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/ai', aiProxyHandler);

// Health Check
app.get(['/health', '/healthz'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: 'Запрос с этого источника запрещен.' });
  }
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Размер файла превышает допустимый лимит.' });
  }
  if (err.message?.includes('Недопустимый формат файла')) {
    return res.status(400).json({ error: err.message });
  }

  logger.error(`Error handling request ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    userId: req.user?.id || null,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ error: isProduction ? 'Внутренняя ошибка сервера.' : 'Внутренняя ошибка сервера: ' + err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Сервер Tormag запущен на порту ${PORT}`);
  startCleanupScheduler();
  startTelegramBotListener();
});

const gracefulShutdown = async (signal) => {
  logger.info(`[SHUTDOWN] Получен сигнал ${signal}. Завершение работы сервера...`);
  server.close(async () => {
    logger.info('[SHUTDOWN] HTTP сервер остановлен.');
    try {
      await prisma.$disconnect();
      logger.info('[SHUTDOWN] Соединение с PostgreSQL закрыто.');
    } catch (e) {
      logger.error('[SHUTDOWN Error] Ошибка закрытия PostgreSQL', { error: e.message });
    }
    try {
      if (redisClient.isOpen) {
        await redisClient.quit();
        logger.info('[SHUTDOWN] Соединение с Redis закрыто.');
      }
    } catch (e) {
      logger.error('[SHUTDOWN Error] Ошибка закрытия Redis', { error: e.message });
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('[SHUTDOWN] Принудительное завершение работы по таймауту 10s.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
