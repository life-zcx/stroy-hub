import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec, execSync } from 'child_process';
import prisma from '../config/db.js';
import { uploadLatestBackupToYandex } from './yandexBackup.js';
import { recalculateProductRating } from '../controllers/reviewController.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || '';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org';

const getSystemChatId = () => TELEGRAM_ADMIN_CHAT_ID || TELEGRAM_CHAT_ID;

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
  await sendMsg(getSystemChatId(), msg);
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

  await sendMsg(getSystemChatId(), msg, replyMarkup);
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

// Command handler logic
const handleCommand = async (chatId, text) => {
  const cleanText = text.trim();

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
