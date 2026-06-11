import fs from 'fs';
import path from 'path';
import os from 'os';
import tls from 'tls';
import { exec, execSync } from 'child_process';
import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import { uploadLatestBackupToYandex } from './yandexBackup.js';
import { recalculateProductRating } from '../controllers/reviewController.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || '';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org';

const getSystemChatId = () => TELEGRAM_ADMIN_CHAT_ID || TELEGRAM_CHAT_ID;

// Helper to check SSL certificate expiration
const checkSslExpiry = (host) => {
  return new Promise((resolve, reject) => {
    try {
      const socket = tls.connect({
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false
      }, () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          reject(new Error('Не удалось получить информацию о сертификате.'));
          socket.destroy();
          return;
        }
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.ceil((validTo - new Date()) / (1000 * 60 * 60 * 24));
        resolve({ validTo, daysRemaining });
        socket.destroy();
      });

      socket.on('error', (err) => {
        reject(err);
      });

      socket.setTimeout(5000, () => {
        reject(new Error('Таймаут подключения к SSL-хосту (5 секунд)'));
        socket.destroy();
      });
    } catch (e) {
      reject(e);
    }
  });
};

// Helper to get default SSL Host
const getSslHost = () => {
  if (process.env.APP_URL) {
    try {
      return new URL(process.env.APP_URL).hostname;
    } catch (e) {}
  }
  if (process.env.CORS_ORIGINS) {
    const firstOrigin = process.env.CORS_ORIGINS.split(',')[0].trim();
    try {
      return new URL(firstOrigin).hostname;
    } catch (e) {}
  }
  return 'stroy-hub.ru';
};

// Helper to check resources
const checkSystemResources = () => {
  const cpus = os.cpus().length;
  const loadAvg = os.loadavg();
  const cpuPercent = ((loadAvg[0] / cpus) * 100);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const ramPercent = (((totalMem - freeMem) / totalMem) * 100);

  let diskPercent = 0;
  try {
    const stdout = execSync("df -h / | tail -n 1 | awk '{print $5}'").toString();
    const match = stdout.match(/(\d+)%/);
    if (match) {
      diskPercent = parseInt(match[1], 10);
    } else {
      // Fallback method
      const stdoutFull = execSync('df -h /').toString();
      const lines = stdoutFull.trim().split('\n');
      if (lines.length > 1) {
        const rootLine = lines.find(l => l.includes(' /')) || lines[1];
        const secondMatch = rootLine.match(/(\d+)%/);
        if (secondMatch) diskPercent = parseInt(secondMatch[1], 10);
      }
    }
  } catch (e) {
    console.error('[RESOURCE MONITOR] Failed to parse disk space:', e);
  }

  return { cpuPercent, ramPercent, diskPercent };
};

// Cooldown tracker for warnings
let lastAlertTimes = {
  cpu: 0,
  ram: 0,
  disk: 0
};
const COOLDOWN_12H = 12 * 60 * 60 * 1000;

export const startResourceMonitoring = () => {
  const checkAndAlert = async () => {
    try {
      const { cpuPercent, ramPercent, diskPercent } = checkSystemResources();
      const now = Date.now();
      const systemChatId = getSystemChatId();
      if (!systemChatId) return;

      const alertMessages = [];

      if (cpuPercent > 90 && (now - lastAlertTimes.cpu > COOLDOWN_12H)) {
        alertMessages.push(`⚠️ *Высокая загрузка CPU:* ${cpuPercent.toFixed(1)}%`);
        lastAlertTimes.cpu = now;
      }

      if (ramPercent > 90 && (now - lastAlertTimes.ram > COOLDOWN_12H)) {
        alertMessages.push(`⚠️ *Высокое потребление RAM:* ${ramPercent.toFixed(1)}%`);
        lastAlertTimes.ram = now;
      }

      if (diskPercent > 90 && (now - lastAlertTimes.disk > COOLDOWN_12H)) {
        alertMessages.push(`⚠️ *Мало свободного места на диске:* ${diskPercent}% занято`);
        lastAlertTimes.disk = now;
      }

      if (alertMessages.length > 0) {
        const fullMsg = `🚨 *Внимание! Ресурсы VPS перегружены:*\n\n` + alertMessages.join('\n');
        await sendMsg(systemChatId, fullMsg);
      }
    } catch (err) {
      console.error('[TELEGRAM BOT] Resource monitoring check failed:', err);
    }
  };

  // Run first check 30 seconds after startup
  setTimeout(checkAndAlert, 30000);

  // Monitor every hour
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(checkAndAlert, ONE_HOUR);
};

// Helper to send a simple markdown message
const sendMsg = async (chatId, text, replyMarkup = null) => {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
    const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[TELEGRAM BOT] Failed to send message:', err);
  }
};

// Helper to edit inline message text
const editMsgText = async (chatId, messageId, text) => {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
    const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('[TELEGRAM BOT] Failed to edit message:', err);
  }
};

// Helper to answer callback queries
const answerCallback = async (callbackQueryId, text = '') => {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
    const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (err) {
    console.error('[TELEGRAM BOT] Failed to answer callback query:', err);
  }
};

// 1. Send Callback Request alert to Telegram
export const sendCallbackAlert = async (callback) => {
  const msg = `📞 *Новая заявка на обратный звонок!*\n\n` +
    `👤 *Имя:* ${callback.userName}\n` +
    `📞 *Телефон:* ${callback.userPhone}\n` +
    `📅 *Дата:* ${new Date(callback.createdAt).toLocaleString('ru-RU')}`;
  await sendMsg(TELEGRAM_CHAT_ID, msg);
};

// 2. Send Partner Request alert to Telegram
export const sendPartnerRequestAlert = async (partner) => {
  const msg = `🤝 *Новая заявка на партнерство!*\n\n` +
    `👤 *Контактное лицо:* ${partner.contactName}\n` +
    `🏢 *Компания:* ${partner.companyName}\n` +
    `📞 *Телефон:* ${partner.contactPhone}\n` +
    `📧 *Email:* ${partner.email}\n` +
    (partner.comment ? `💬 *Комментарий:* "${partner.comment}"\n` : '') +
    `📅 *Дата:* ${new Date(partner.createdAt).toLocaleString('ru-RU')}`;
  await sendMsg(TELEGRAM_CHAT_ID, msg);
};

// 3. Send Review Moderation alert with Inline buttons
export const sendReviewModerationAlert = async (review, product) => {
  const msg = `📝 *Новый отзыв на модерацию*\n\n` +
    `👤 *Автор:* ${review.user?.name || 'Покупатель'} (${review.user?.email || ''})\n` +
    `📦 *Товар:* ${product.name}\n` +
    `⭐ *Оценка:* ${'⭐'.repeat(review.rating)}\n` +
    `💬 *Комментарий:* "${review.comment || 'Без комментария'}"`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Одобрить', callback_data: `review_approve:${review.id}` },
        { text: '❌ Отклонить', callback_data: `review_reject:${review.id}` }
      ]
    ]
  };

  await sendMsg(TELEGRAM_CHAT_ID, msg, replyMarkup);
};

// 4. Run database backup locally inside the backend container
const runManualBackup = () => {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      const password = parsed.password;
      const username = parsed.username;
      const host = parsed.hostname;
      const port = parsed.port || '5432';
      const dbName = parsed.pathname.split('?')[0].substring(1);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `manual-backup-${timestamp}.sql.gz`;
      
      const backupDir = '/app/backups';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const outputPath = path.join(backupDir, filename);

      console.log(`[BACKUP] Starting manual backup to ${outputPath}...`);

      const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} | gzip > ${outputPath}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('[BACKUP ERROR] pg_dump failed:', stderr);
          return reject(error);
        }
        console.log(`[BACKUP SUCCESS] Created backup: ${filename}`);
        resolve({ filename, outputPath });
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Helper to read the last N lines of a daily log file
const readLastLogLines = (filenamePattern, maxLines = 50) => {
  const logDir = path.resolve('logs');
  if (!fs.existsSync(logDir)) return 'Папка логов не найдена';

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = filenamePattern.replace('%DATE%', dateStr);
  const logPath = path.join(logDir, filename);

  if (!fs.existsSync(logPath)) {
    return `Файл логов за сегодня (${filename}) не найден.`;
  }

  try {
    const data = fs.readFileSync(logPath, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    const lastLines = lines.slice(-maxLines);
    return lastLines.join('\n');
  } catch (err) {
    return `Ошибка чтения логов: ${err.message}`;
  }
};

// Command handler logic
const handleCommand = async (chatId, text) => {
  let cleanText = text.trim();
  if (cleanText.includes('@')) {
    cleanText = cleanText.split('@')[0];
  }

  if (cleanText === '/help') {
    const helpMsg = `🛠️ *Доступные команды Telegram-бота:*\n\n` +
      `🖥️ /status — Показать параметры VPS (CPU, RAM, диск, аптайм)\n` +
      `📊 /db — Статус СУБД Postgres и счетчики таблиц\n` +
      `🧹 /db_optimize — Оптимизация БД (VACUUM ANALYZE)\n` +
      `🧹 /redis_clear — Полная очистка кэша Redis\n` +
      `📈 /redis_info — Статистика и память кэша Redis\n` +
      `🔒 /ssl_check — Проверка срока действия SSL-сертификата\n` +
      `📝 /logs — Вывести последние 50 строк общего лога бэкенда\n` +
      `🚨 /logs_error — Вывести последние 30 строк лога ошибок\n` +
      `💾 /backup — Резервное копирование базы данных на Яндекс.Диск\n` +
      `🔄 /restart — Безопасно перезапустить контейнер бэкенда`;
    await sendMsg(chatId, helpMsg);
    return;
  }

  if (cleanText === '/status') {
    // 1. Calculate memory usage
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const ramPercent = ((usedMem / totalMem) * 100).toFixed(0);

    // 2. CPU load average
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg();
    const loadPercent = ((loadAvg[0] / cpus) * 100).toFixed(0);

    // 3. Disk space (runs df -h)
    let diskText = 'Недоступно';
    try {
      const stdout = execSync('df -h /').toString();
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        // Find line containing "/"
        const rootLine = lines.find(l => l.includes(' /')) || lines[1];
        diskText = rootLine.replace(/\s+/g, ' ');
      }
    } catch (e) {
      diskText = 'Ошибка определения диска';
    }

    const statusMsg = `🖥️ *Статус сервера TORMAG*\n\n` +
      `💻 *Загрузка CPU:* ${loadPercent}% (Load Avg: ${loadAvg[0].toFixed(2)})\n` +
      `🧠 *RAM:* ${usedMem} GB / ${totalMem} GB (${ramPercent}% использовано)\n` +
      `💾 *Диск:* \`${diskText}\`\n` +
      `🕒 *Uptime:* ${(os.uptime() / 3600).toFixed(1)} часов`;

    await sendMsg(chatId, statusMsg);
    return;
  }

  if (cleanText === '/db') {
    await sendMsg(chatId, `⏳ *Запрос статистики базы данных...*`);
    try {
      const [users, products, orders, reviews, callbacks, partners] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.review.count(),
        prisma.callbackRequest.count(),
        prisma.partnerRequest.count()
      ]);
      const dbMsg = `📊 *Статус базы данных Postgres:*\n\n` +
        `🟢 *Соединение:* Активно\n` +
        `👥 *Пользователей:* ${users}\n` +
        `📦 *Товаров:* ${products}\n` +
        `🛒 *Заказов:* ${orders}\n` +
        `📝 *Отзывов:* ${reviews}\n` +
        `📞 *Звонков (Callback):* ${callbacks}\n` +
        `🤝 *Партнерских заявок:* ${partners}`;
      await sendMsg(chatId, dbMsg);
    } catch (err) {
      await sendMsg(chatId, `🔴 *Ошибка соединения с СУБД:* \`${err.message}\``);
    }
    return;
  }

  if (cleanText === '/redis_clear') {
    await sendMsg(chatId, `🧹 *Очищаю кэш Redis...*`);
    try {
      await redisClient.flushAll();
      await sendMsg(chatId, `🟢 *Кэш Redis успешно и полностью очищен!*`);
    } catch (err) {
      await sendMsg(chatId, `🔴 *Ошибка очистки Redis:* \`${err.message}\``);
    }
    return;
  }

  if (cleanText === '/redis_info') {
    await sendMsg(chatId, `⏳ *Запрос статистики Redis...*`);
    try {
      const infoStr = await redisClient.info();
      const memoryMatch = infoStr.match(/used_memory_human:([^\r\n]+)/);
      const clientsMatch = infoStr.match(/connected_clients:([^\r\n]+)/);
      const hitsMatch = infoStr.match(/keyspace_hits:([^\r\n]+)/);
      const missesMatch = infoStr.match(/keyspace_misses:([^\r\n]+)/);

      const mem = memoryMatch ? memoryMatch[1] : 'Неизвестно';
      const clients = clientsMatch ? clientsMatch[1] : 'Неизвестно';
      const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      const total = hits + misses;
      const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%';

      const redisMsg = `📈 *Статистика Redis:*\n\n` +
        `🧠 *Использование памяти:* ${mem}\n` +
        `👥 *Активных подключений:* ${clients}\n` +
        `🎯 *Эффективность кэша (Hit Rate):* ${hitRate} (Hits: ${hits}, Misses: ${misses})`;
      await sendMsg(chatId, redisMsg);
    } catch (err) {
      await sendMsg(chatId, `🔴 *Ошибка получения статистики Redis:* \`${err.message}\``);
    }
    return;
  }

  if (cleanText === '/db_optimize') {
    await sendMsg(chatId, `🧹 *Запускаю оптимизацию базы данных (VACUUM ANALYZE)...*`);
    try {
      const start = Date.now();
      // Execute vacuum without blocking transaction sequence
      await prisma.$executeRawUnsafe('VACUUM ANALYZE;');
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      await sendMsg(chatId, `🟢 *Оптимизация базы данных успешно завершена!* (заняло ${duration} сек)`);
    } catch (err) {
      await sendMsg(chatId, `🔴 *Ошибка при оптимизации БД:* \`${err.message}\``);
    }
    return;
  }

  if (cleanText === '/ssl_check') {
    const host = getSslHost();
    await sendMsg(chatId, `⏳ *Проверяю SSL-сертификат для хоста* \`${host}\`...`);
    try {
      const { validTo, daysRemaining } = await checkSslExpiry(host);
      const sslMsg = `🔒 *Проверка SSL-сертификата:*\n\n` +
        `🌐 *Хост:* \`${host}\`\n` +
        `📅 *Действителен до:* ${validTo.toLocaleDateString('ru-RU')}\n` +
        `⏳ *Осталось дней:* ${daysRemaining} дн.`;
      await sendMsg(chatId, sslMsg);
    } catch (err) {
      await sendMsg(chatId, `🔴 *Ошибка проверки SSL:* \`${err.message}\``);
    }
    return;
  }

  if (cleanText === '/logs') {
    const logData = readLastLogLines('combined-%DATE%.log', 50);
    const sliceData = logData.slice(-4000); // Telegram limit
    await sendMsg(chatId, `📝 *Последние 50 логов бэкенда:*\n\n\`\`\`\n${sliceData}\n\`\`\``);
    return;
  }

  if (cleanText === '/logs_error') {
    const logData = readLastLogLines('error-%DATE%.log', 30);
    const sliceData = logData.slice(-4000);
    await sendMsg(chatId, `🚨 *Последние 30 ошибок бэкенда:*\n\n\`\`\`\n${sliceData}\n\`\`\``);
    return;
  }

  if (cleanText === '/restart') {
    await sendMsg(chatId, `🔄 *Перезапускаю бэкенд... Бот будет временно недоступен.*`);
    setTimeout(() => {
      process.exit(0);
    }, 1000);
    return;
  }

  if (cleanText === '/backup') {
    await sendMsg(chatId, `⏳ *Запускаю резервное копирование и отправку на Яндекс.Диск...*`);
    try {
      await runManualBackup();
      await uploadLatestBackupToYandex();
      // Success alerts are sent by yandexBackup.js automatically!
    } catch (error) {
      await sendMsg(chatId, `❌ *Ошибка при ручном бэкапе:* \`${error.message}\``);
    }
    return;
  }
};

// Callback Query handler logic
const handleCallbackQuery = async (query) => {
  const { id: queryId, data, message } = query;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (data.startsWith('review_approve:')) {
    const reviewId = parseInt(data.split(':')[1], 10);
    try {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) {
        await answerCallback(queryId, 'Отзыв уже удален или не найден.');
        return;
      }

      await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: true },
      });

      await recalculateProductRating(review.productId);

      const newText = message.text + `\n\n✅ *Отзыв одобрен и опубликован на сайте!*`;
      await editMsgText(chatId, messageId, newText);
      await answerCallback(queryId, 'Отзыв успешно одобрен!');
    } catch (error) {
      console.error('[TELEGRAM BOT] Failed to approve review via callback:', error);
      await answerCallback(queryId, 'Ошибка при одобрении отзыва.');
    }
    return;
  }

  if (data.startsWith('review_reject:')) {
    const reviewId = parseInt(data.split(':')[1], 10);
    try {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) {
        await answerCallback(queryId, 'Отзыв не найден.');
        return;
      }

      await prisma.review.delete({ where: { id: reviewId } });
      await recalculateProductRating(review.productId);

      const newText = message.text + `\n\n❌ *Отзыв отклонен и удален из базы.*`;
      await editMsgText(chatId, messageId, newText);
      await answerCallback(queryId, 'Отзыв успешно отклонен и удален.');
    } catch (error) {
      console.error('[TELEGRAM BOT] Failed to reject review via callback:', error);
      await answerCallback(queryId, 'Ошибка при отклонении отзыва.');
    }
    return;
  }
};

// Core update handler
const handleUpdate = async (update) => {
  const authorizedChats = [
    TELEGRAM_ADMIN_CHAT_ID,
    TELEGRAM_CHAT_ID
  ].filter(Boolean).map(id => id.trim());

  if (update.message) {
    const chat = update.message.chat;
    const text = update.message.text;

    // Security check: only respond to commands from configured admin chats
    if (!authorizedChats.includes(String(chat.id))) return;

    if (text && text.startsWith('/')) {
      await handleCommand(chat.id, text);
    }
  } else if (update.callback_query) {
    const chat = update.callback_query.message.chat;

    // Security check
    if (!authorizedChats.includes(String(chat.id))) return;

    await handleCallbackQuery(update.callback_query);
  }
};

// Long Polling listener
export const startTelegramBotListener = () => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TELEGRAM BOT] Telegram Bot Token not set. Polling listener disabled.');
    return;
  }

  console.log('[TELEGRAM BOT] Starting interactive polling listener...');
  
  // Start resource monitoring alerts
  startResourceMonitoring();
  
  let lastUpdateId = 0;
  
  const poll = async () => {
    try {
      const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
      const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
      
      const res = await fetch(url);
      if (!res.ok) {
        setTimeout(poll, 10000);
        return;
      }
      
      const data = await res.json();
      if (data.result && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await handleUpdate(update);
        }
      }
      setTimeout(poll, 500);
    } catch (err) {
      console.error('[TELEGRAM BOT] Polling error:', err.message);
      setTimeout(poll, 10000);
    }
  };

  poll();
};
