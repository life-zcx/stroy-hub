import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { MAX_UPLOAD_SIZE_MB } from './env.js';

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

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}.webp`;
  const filePath = path.join(uploadDir, filename);

  // Resize to max 1200px width (keeping aspect ratio) and convert to WebP format with 80% quality
  await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filePath);

  // Populate filename and path as if saved by diskStorage
  file.filename = filename;
  file.path = filePath;
  file.mimetype = 'image/webp';

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
  'application/octet-stream', // some clients send this for csv/xlsx; extension is still checked below
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
  storage: multer.memoryStorage(), // spreadsheet files are small and easy to parse in-memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for price lists
  },
  fileFilter: excelFileFilter,
});

