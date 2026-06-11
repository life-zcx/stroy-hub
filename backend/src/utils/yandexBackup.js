import fs from 'fs';
import path from 'path';

const BACKUP_DIR = '/app/backups';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org';

const sendTelegramAlert = async (text) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const apiBase = TELEGRAM_API_BASE.replace(/\/+$/, '');
    const url = `${apiBase}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('[YANDEX BACKUP] Failed to send Telegram alert:', err);
  }
};

const getAllFilesRecursively = (dirPath, arrayOfFiles = []) => {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFilesRecursively(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

export const uploadLatestBackupToYandex = async () => {
  const user = process.env.YANDEX_DISK_USER?.trim();
  const pass = process.env.YANDEX_DISK_PASS?.trim();

  if (!user || !pass) {
    console.warn('[YANDEX BACKUP BYPASS] YANDEX_DISK_USER or YANDEX_DISK_PASS is not configured. Skipping upload.');
    return;
  }

  console.log('[YANDEX BACKUP] Initiating backup scan...');

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.warn(`[YANDEX BACKUP BYPASS] Directory ${BACKUP_DIR} does not exist. Skipping.`);
      return;
    }

    const allFiles = getAllFilesRecursively(BACKUP_DIR);
    const files = allFiles
      .filter(filePath => filePath.endsWith('.sql.gz') || filePath.endsWith('.gz') || filePath.endsWith('.sql'))
      .map(filePath => {
        const name = path.basename(filePath);
        const stat = fs.statSync(filePath);
        return { name, filePath, mtime: stat.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (files.length === 0) {
      console.warn('[YANDEX BACKUP] No database backup files found to upload.');
      return;
    }

    const latest = files[0];
    console.log(`[YANDEX BACKUP] Found latest backup: ${latest.name} (${(fs.statSync(latest.filePath).size / (1024 * 1024)).toFixed(2)} MB). Starting upload...`);

    const authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
    const uploadUrl = `https://webdav.yandex.ru/${latest.name}`;

    const fileStream = fs.createReadStream(latest.filePath);

    // Using node's native fetch which handles streams correctly in Node 18+
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream,
      duplex: 'half', // Required for request bodies containing streams in standard fetch
    });

    if (response.ok) {
      const msg = `💾 *[Резервное копирование]*\nБэкап \`${latest.name}\` успешно загружен на Яндекс.Диск!`;
      console.log(`[YANDEX BACKUP SUCCESS] ${msg}`);
      await sendTelegramAlert(msg);
    } else {
      const errText = await response.text().catch(() => 'No body');
      const errorMsg = `⚠️ *[ОШИБКА БЭКАПА]*\nНе удалось загрузить бэкап \`${latest.name}\` на Яндекс.Диск.\nСтатус: ${response.status} ${response.statusText}\nДетали: \`${errText}\``;
      console.error(`[YANDEX BACKUP ERROR] ${errorMsg}`);
      await sendTelegramAlert(errorMsg);
    }
  } catch (error) {
    const errorMsg = `⚠️ *[ОШИБКА БЭКАПА]*\nПроизошла системная ошибка при отправке бэкапа на Яндекс.Диск:\n\`${error.message}\``;
    console.error(`[YANDEX BACKUP ERROR]`, error);
    await sendTelegramAlert(errorMsg);
  }
};
