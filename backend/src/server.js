import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
import { getDynamicSitemap } from './controllers/sitemapController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (!isProduction && allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
};

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware. Full records are available through docker logs.
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const logLevel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    const userId = req.user?.id ? ` user=${req.user.id}` : '';
    const ip = req.ip || req.socket?.remoteAddress || '-';
    console.log(
      `[${new Date().toISOString()}] ${logLevel} ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ip=${ip}${userId}`
    );
  });

  next();
});

// Routes
app.get('/sitemap.xml', getDynamicSitemap);
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/callbacks', callbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/partner-requests', partnerRequestRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/analytics', analyticsRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
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

  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    userId: req.user?.id || null,
  });
  res.status(500).json({ error: 'Внутренняя ошибка сервера: ' + err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер Tormag запущен на порту ${PORT}`);
});
