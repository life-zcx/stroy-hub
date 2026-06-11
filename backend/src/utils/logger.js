import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID)?.trim() || '';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org';

// Функция для отправки критических ошибок в Telegram
const sendTelegramError = (message, meta) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
  const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const text = `🚨 *Критическая ошибка на сервере Tormag.kz*\n\n` +
    `💬 *Сообщение:* \`${message}\`\n\n` +
    (meta && Object.keys(meta).length ? `⚙️ *Метаданные:* \`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\`` : '');

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text.slice(0, 4000), // Ограничение Telegram на размер сообщения
      parse_mode: 'Markdown',
    }),
  }).catch((err) => {
    console.error('[LOGGER TELEGRAM ERROR] Failed to send log to Telegram:', err);
  });
};

// Формат вывода в консоль
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Формат вывода в файлы
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logDirectory = path.join(__dirname, '../../logs');

// Создание логгера Winston
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    // Вращающийся файл для ошибок
    new DailyRotateFile({
      filename: path.join(logDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '20m',
    }),
    // Вращающийся файл для всех логов
    new DailyRotateFile({
      filename: path.join(logDirectory, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),
  ],
});

// Добавляем консольный вывод, если не в production (или в продакшене тоже для просмотра через docker logs)
logger.add(new winston.transports.Console({
  format: consoleFormat,
}));

// Перехватываем ошибки и отправляем в Telegram
logger.on('data', (log) => {
  if (log.level === 'error') {
    const { level, message, timestamp, ...meta } = log;
    sendTelegramError(message, meta);
  }
});

export default logger;
