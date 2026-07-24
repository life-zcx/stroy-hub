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

async function compressAndSaveImage(file) {
  if (!file || !file.buffer) return;

  // Magic Bytes validation for common image signatures
  const buf = file.buffer;
  const isJpeg = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const isGif = buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
  const isWebp = buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    throw new Error('Недопустимый формат файла. Бинарная сигнатура файла не совпадает с изображением.');
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';

  if (sharp) {
    // Validate image integrity with sharp
    try {
      await sharp(file.buffer).metadata();
    } catch (err) {
      throw new Error('Файл поврежден или не является действительным изображением.');
    }

    const filename = `${uniqueSuffix}.webp`;
    const filePath = path.join(uploadDir, filename);

    // Resize to max 1200px width (keeping aspect ratio) and convert to WebP format with 80% quality
    await sharp(file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);

    file.filename = filename;
    file.path = filePath;
    file.mimetype = 'image/webp';
  } else {
    // Fallback: save as original format if sharp is not installed
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    file.filename = filename;
    file.path = filePath;
  }

  // Free memory buffer
  delete file.buffer;
}

const wrapMiddleware = (middleware) => {
  return [
    middleware,
    async (req, res, next) => {
      try {
        if (req.file) {
          await compressAndSaveImage(req.file);
        }
        if (req.files) {
          if (Array.isArray(req.files)) {
            for (const file of req.files) {
              await compressAndSaveImage(file);
            }
          } else {
            for (const field of Object.keys(req.files)) {
              for (const file of req.files[field]) {
                await compressAndSaveImage(file);
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

export const imageUpload = {
  single: (field) => wrapMiddleware(memoryUpload.single(field)),
  array: (field, maxCount) => wrapMiddleware(memoryUpload.array(field, maxCount)),
  fields: (fields) => wrapMiddleware(memoryUpload.fields(fields)),
  none: () => memoryUpload.none(),
  any: () => wrapMiddleware(memoryUpload.any()),
};

const allowedExcelMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/octet-stream',
]);

function excelFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtension = ext === '.xlsx' || ext === '.csv';
  if (!allowedExtension || !allowedExcelMimeTypes.has(file.mimetype)) {
    cb(new Error('Недопустимый формат файла. Разрешены только XLSX и CSV.'));
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
