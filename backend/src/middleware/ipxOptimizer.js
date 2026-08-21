import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { safeErrorMessage } from '../utils/apiError.js';

let sharp = null;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default || sharpModule;
} catch (e) {
  logger.warn('[IPX OPTIMIZER] Sharp module is not available.');
}

const cacheDir = path.join(process.cwd(), 'uploads', 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// SEC-002: Allowlist внешних хостов для загрузки изображений (SSRF защита)
// Добавить допустимые домены через переменную окружения IPX_ALLOWED_HOSTS (через запятую)
const ALLOWED_EXTERNAL_HOSTS = new Set(
  (process.env.IPX_ALLOWED_HOSTS || 'media.tormag.kz,storage.tssp.kz')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

// Регулярное выражение для блокировки приватных IP-диапазонов и cloud metadata
const PRIVATE_HOST_REGEX =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|::1)/i;

/**
 * SEC-002: Валидация внешнего URL перед fetch.
 * Блокирует SSRF: приватные IP, cloud IMDS, хосты не из allowlist.
 */
function validateExternalUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Недопустимый формат внешнего URL');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_REGEX.test(hostname)) {
    throw new Error(`Доступ к приватному адресу запрещён: ${hostname}`);
  }
  if (!ALLOWED_EXTERNAL_HOSTS.has(hostname)) {
    throw new Error(`Внешний хост не в списке разрешённых: ${hostname}`);
  }
}

/**
 * Parses IPX modifier string like "f_webp&s_800x800" or "s_400x400"
 */
function parseModifiers(modifiersStr = '') {
  let format = 'webp';
  let width = null;
  let height = null;
  let fit = 'contain'; // default fit for product cards to keep 1:1 ratio cleanly

  const parts = modifiersStr.split('&');
  for (const part of parts) {
    if (part.startsWith('f_')) {
      format = part.slice(2).toLowerCase();
      if (format === 'jpg') format = 'jpeg';
    } else if (part.startsWith('s_')) {
      const sizeStr = part.slice(2);
      const [w, h] = sizeStr.split('x').map(n => parseInt(n, 10));
      if (!isNaN(w)) width = w;
      if (!isNaN(h)) height = h;
    } else if (part.startsWith('w_')) {
      const w = parseInt(part.slice(2), 10);
      if (!isNaN(w)) width = w;
    } else if (part.startsWith('h_')) {
      const h = parseInt(part.slice(2), 10);
      if (!isNaN(h)) height = h;
    } else if (part.startsWith('fit_')) {
      fit = part.slice(4).toLowerCase();
    }
  }

  // Cap dimensions to reasonable maximums to prevent memory attacks
  if (width) width = Math.min(2000, Math.max(10, width));
  if (height) height = Math.min(2000, Math.max(10, height));

  return { format, width, height, fit };
}

/**
 * Middleware or Controller for handling dynamic IPX image requests:
 * Matches: /_ipx/:modifiers/* or /api/ipx?url=...&s=800x800&f=webp
 */
export const handleIpxImageRequest = async (req, res) => {
  try {
    let modifiersStr = '';
    let targetUrlOrPath = '';

    // Handle URL path style: /_ipx/f_webp&s_800x800/uploads/products/image.png
    // or /_ipx/f_webp&s_800x800/https://storage.tssp.kz/...
    const fullPath = req.originalUrl.split('?')[0];
    const ipxMatch = fullPath.match(/^\/_ipx\/([^/]+)\/(.+)$/);

    if (ipxMatch) {
      modifiersStr = ipxMatch[1];
      targetUrlOrPath = ipxMatch[2];
    } else if (req.query.url) {
      targetUrlOrPath = req.query.url;
      const f = req.query.f || 'webp';
      const s = req.query.s || (req.query.w && req.query.h ? `${req.query.w}x${req.query.h}` : '');
      const fit = req.query.fit || 'contain';
      modifiersStr = `f_${f}${s ? `&s_${s}` : ''}&fit_${fit}`;
    } else {
      return res.status(400).json({ error: 'Неверный формат запроса к IPX оптимизатору' });
    }

    // Decode target URL / Path
    targetUrlOrPath = decodeURIComponent(targetUrlOrPath);
    // Restore collapsed protocol slashes (e.g., "https:/storage.tssp.kz" -> "https://storage.tssp.kz")
    targetUrlOrPath = targetUrlOrPath.replace(/^(https?):\/+([^\/])/i, '$1://$2');

    // Parse width, height, format, fit
    const { format, width, height, fit } = parseModifiers(modifiersStr);

    // Unique cache hash key based on parameters
    const cacheKeyString = `${targetUrlOrPath}_w${width || 'auto'}_h${height || 'auto'}_f${format}_fit${fit}`;
    const hashKey = crypto.createHash('md5').update(cacheKeyString).digest('hex');
    const cachedFilename = `${hashKey}.${format}`;
    const cachedFilePath = path.join(cacheDir, cachedFilename);

    // If cached file exists, serve it directly!
    if (fs.existsSync(cachedFilePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', `image/${format === 'jpeg' ? 'jpeg' : format}`);
      return res.sendFile(cachedFilePath);
    }

    // Fetch or read original image buffer
    let inputBuffer = null;

    if (targetUrlOrPath.startsWith('http://') || targetUrlOrPath.startsWith('https://')) {
      // SEC-002: SSRF protection — валидация хоста перед fetch
      try {
        validateExternalUrl(targetUrlOrPath);
      } catch (validationErr) {
        logger.warn(`[IPX OPTIMIZER] SSRF blocked: ${validationErr.message} | url=${targetUrlOrPath.substring(0, 100)}`);
        return res.status(403).json({ error: 'Доступ к указанному URL запрещён.' });
      }
      const response = await fetch(targetUrlOrPath, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        return res.status(404).json({ error: 'Не удалось загрузить исходное изображение по внешнему URL' });
      }
      const arrayBuffer = await response.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      // Local path logic
      let normalizedPath = targetUrlOrPath.replace(/^\/+/, '');
      let localPath = path.join(process.cwd(), normalizedPath);

      // SEC-003: Path Traversal protection — файл должен находиться внутри /uploads
      const uploadsRoot = path.resolve(process.cwd(), 'uploads');
      const resolvedPath = path.resolve(localPath);
      const altPath = path.resolve(path.join(process.cwd(), 'uploads', path.basename(normalizedPath)));

      if (
        !resolvedPath.startsWith(uploadsRoot + path.sep) &&
        resolvedPath !== uploadsRoot &&
        !altPath.startsWith(uploadsRoot + path.sep)
      ) {
        logger.warn(`[IPX OPTIMIZER] Path traversal blocked: ${resolvedPath}`);
        return res.status(403).json({ error: 'Доступ к файлу запрещён.' });
      }

      if (!fs.existsSync(localPath)) {
        // Try inside uploads dir
        localPath = path.join(process.cwd(), 'uploads', path.basename(normalizedPath));
      }

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ error: 'Файл не найден.' });
      }

      inputBuffer = fs.readFileSync(localPath);
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return res.status(400).json({ error: 'Пустой файл изображения' });
    }

    // If Sharp is not installed or error occurs, return raw image
    if (!sharp) {
      res.setHeader('Content-Type', 'image/jpeg');
      return res.send(inputBuffer);
    }

    // Perform image transformation via Sharp
    let pipeline = sharp(inputBuffer).rotate();

    if (width || height) {
      const resizeOptions = {
        width: width || undefined,
        height: height || undefined,
        fit: fit === 'contain' ? 'contain' : fit === 'cover' ? 'cover' : 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // transparent or white background
      };
      pipeline = pipeline.resize(resizeOptions);
    }

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: 82, effort: 4 });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 8 });
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality: 82, progressive: true });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality: 75 });
    } else {
      pipeline = pipeline.webp({ quality: 82 });
    }

    const outputBuffer = await pipeline.toBuffer();

    // Save to disk cache for fast subsequent hits
    try {
      fs.writeFileSync(cachedFilePath, outputBuffer);
    } catch (err) {
      logger.error(`[IPX OPTIMIZER] Error writing cache file: ${err.message}`);
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', `image/${format === 'jpeg' ? 'jpeg' : format}`);
    return res.send(outputBuffer);

  } catch (error) {
    logger.error(`[IPX OPTIMIZER] Error processing image request: ${error.message}`);
    return res.status(500).json({ error: safeErrorMessage(error, 'Ошибка обработки изображения.') });
  }
};
