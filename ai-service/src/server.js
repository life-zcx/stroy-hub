import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5005;

app.disable('x-powered-by');
app.use(helmet());

// CORS: Only allow requests from the backend container and explicitly listed origins.
// In Docker, this service is only reachable internally, but restrict explicitly for defense-in-depth.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        // Allow same-server requests (no Origin header in internal Docker calls)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: ${origin}`));
        }
      }
    : true, // Fallback: allow all (for local dev without CORS_ORIGINS set)
  credentials: true,
}));

// AI service handles JSON and file base64 payloads — keep a reasonable limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/ai', aiRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service', timestamp: new Date() });
});

// Global error handler — catches unhandled errors in routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[AI SERVICE] Unhandled error:', err?.message || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Внутренняя ошибка AI-сервиса' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AI SERVICE] Tormag AI Microservice is running on port ${PORT}`);
});

// Graceful shutdown: allow in-flight requests to finish before exiting
const gracefulShutdown = (signal) => {
  console.log(`[AI SERVICE] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[AI SERVICE] HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if requests don't finish
  setTimeout(() => {
    console.error('[AI SERVICE] Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[AI SERVICE] Unhandled Promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[AI SERVICE] Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});
