import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from './logger.js';
import { isR2Configured, uploadToR2 } from '../services/r2Service.js';

let sharp = null;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default || sharpModule;
} catch (e) {
  logger.warn('[MEDIA OPTIMIZER] Sharp module is not available.');
}

const localUploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

/**
 * Generate virtual path key for object storage
 * Examples:
 *  - products/123/1722253000-a8f3d1.webp
 *  - categories/building-materials/1722253000-a8f3d1.webp
 *  - general/1722253000-a8f3d1.webp
 */
export const buildVirtualKey = (folder = 'products', entityId = null, filenameExt = 'webp') => {
  const cleanFolder = (folder || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(4).toString('hex');
  const filename = `${timestamp}-${randomHash}.${filenameExt}`;

  if (entityId) {
    const cleanEntityId = String(entityId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `${cleanFolder}/${cleanEntityId}/${filename}`;
  }

  return `${cleanFolder}/${filename}`;
};

/**
 * Process raw image buffer: resize, auto-rotate EXIF, convert to WebP
 * @param {Buffer} inputBuffer
 * @param {Object} [options]
 * @returns {Promise<Buffer>}
 */
export const optimizeImageBuffer = async (inputBuffer, options = {}) => {
  const { maxWidth = 1400, quality = 80 } = options;

  if (!sharp) {
    logger.warn('[MEDIA OPTIMIZER] Sharp not installed, returning raw buffer.');
    return inputBuffer;
  }

  return await sharp(inputBuffer)
    .rotate() // Auto-rotate according to EXIF
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 5 })
    .toBuffer();
};

/**
 * High-level function: Takes file object (from Multer memoryStorage/disk),
 * compresses to WebP, uploads to Cloudflare R2 (or saves locally as fallback).
 *
 * @param {Object} params
 * @param {Buffer} [params.buffer] - File buffer
 * @param {string} [params.filePath] - Local file path if saved on disk
 * @param {string} [params.originalname] - Original filename
 * @param {string} [params.folder='products'] - Virtual folder (products, categories, etc.)
 * @param {string|number} [params.entityId=null] - Product ID, Category ID, SKU, etc.
 * @returns {Promise<{ url: string, key?: string }>}
 */
export const processAndUploadMedia = async ({
  buffer,
  filePath,
  originalname = 'image.jpg',
  folder = 'products',
  entityId = null,
}) => {
  let rawBuffer = buffer;

  if (!rawBuffer && filePath && fs.existsSync(filePath)) {
    rawBuffer = fs.readFileSync(filePath);
  }

  if (!rawBuffer || rawBuffer.length === 0) {
    throw new Error('Файл изображения пуст или не найден.');
  }

  // Skip SVG or already processed files if explicitly needed, but convert standard raster formats (JPG/PNG/GIF/WEBP)
  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.svg') {
    // SVGs do not need sharp rasterization
    const virtualKey = buildVirtualKey(folder, entityId, 'svg');
    if (isR2Configured()) {
      return await uploadToR2({ buffer: rawBuffer, key: virtualKey, contentType: 'image/svg+xml' });
    } else {
      const localFilename = path.basename(virtualKey);
      const localPath = path.join(localUploadDir, localFilename);
      fs.writeFileSync(localPath, rawBuffer);
      return { url: `/uploads/${localFilename}` };
    }
  }

  // Optimize and convert to WebP
  let optimizedWebpBuffer;
  try {
    optimizedWebpBuffer = await optimizeImageBuffer(rawBuffer);
  } catch (err) {
    logger.error(`[MEDIA OPTIMIZER] Error optimizing image ${originalname}: ${err.message}`);
    optimizedWebpBuffer = rawBuffer; // fallback to raw
  }

  const objectKey = buildVirtualKey(folder, entityId, 'webp');

  // Attempt R2 Upload
  if (isR2Configured()) {
    try {
      const r2Result = await uploadToR2({
        buffer: optimizedWebpBuffer,
        key: objectKey,
        contentType: 'image/webp',
      });

      // Cleanup local temp file if exists
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }

      return r2Result;
    } catch (err) {
      logger.error(`[MEDIA OPTIMIZER] R2 Upload failed, saving to local uploads fallback: ${err.message}`);
    }
  }

  // Fallback to local storage
  const localFilename = path.basename(objectKey);
  const localSavePath = path.join(localUploadDir, localFilename);
  fs.writeFileSync(localSavePath, optimizedWebpBuffer);

  if (filePath && fs.existsSync(filePath) && filePath !== localSavePath) {
    try { fs.unlinkSync(filePath); } catch {}
  }

  return { url: `/uploads/${localFilename}`, key: localFilename };
};
