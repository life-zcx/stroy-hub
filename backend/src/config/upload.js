import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { MAX_UPLOAD_SIZE_MB } from './env.js';

let sharp = null;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default || sharpModule;
} catch (e) {
  console.warn('[UPLOAD] Optional dependency "sharp" not found in node_modules yet. Fallback to standard file save.');
}

const uploadDir = './uploads';
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const memoryStorage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error('Недопустимый формат файла. Разрешены JPG, PNG, WEBP и GIF.'));
    return;
  }

  cb(null, true);
}

const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

import { processAndUploadMedia } from '../utils/mediaOptimizer.js';

async function compressAndSaveImage(file, folderName = 'general') {
  if (!file || (!file.buffer && !file.path)) return;

  if (file.buffer) {
    // Magic Bytes validation for common image signatures
    const buf = file.buffer;
    const isJpeg = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const isGif = buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
    const isWebp = buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      throw new Error('Недопустимый формат файла. Бинарная сигнатура файла не совпадает с изображением.');
    }
  }

  const result = await processAndUploadMedia({
    buffer: file.buffer,
    filePath: file.path,
    originalname: file.originalname || 'image.jpg',
    folder: folderName,
  });

  file.filename = path.basename(result.key || result.url);
  file.path = result.url;
  file.url = result.url;
  file.mimetype = 'image/webp';
}


const wrapMiddleware = (middleware, folderName = 'general') => {
  return [
    middleware,
    async (req, res, next) => {
      try {
        if (req.file) {
          await compressAndSaveImage(req.file, folderName);
        }
        if (req.files) {
          if (Array.isArray(req.files)) {
            for (const file of req.files) {
              await compressAndSaveImage(file, folderName);
            }
          } else {
            for (const field of Object.keys(req.files)) {
              for (const file of req.files[field]) {
                await compressAndSaveImage(file, folderName);
              }
            }
          }
        }
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
};

export const createImageUploader = (folderName = 'general') => ({
  single: (field) => wrapMiddleware(memoryUpload.single(field), folderName),
  array: (field, maxCount) => wrapMiddleware(memoryUpload.array(field, maxCount), folderName),
  fields: (fields) => wrapMiddleware(memoryUpload.fields(fields), folderName),
  none: () => memoryUpload.none(),
  any: () => wrapMiddleware(memoryUpload.any(), folderName),
});

export const imageUpload = createImageUploader('products');
export const returnImageUpload = createImageUploader('returns');

const allowedEstimateMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/octet-stream',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const allowedEstimateExtensions = new Set(['.xlsx', '.csv', '.pdf', '.jpg', '.jpeg', '.png', '.webp']);

function excelFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtension = allowedEstimateExtensions.has(ext);
  if (!allowedExtension) {
    cb(new Error('Недопустимый формат файла. Разрешены только XLSX, CSV, PDF, JPG, PNG и WEBP.'));
    return;
  }
  cb(null, true);
}

export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: excelFileFilter,
});

