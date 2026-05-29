import fs from 'fs';
import path from 'path';
import multer from 'multer';
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error('Недопустимый формат файла. Разрешены JPG, PNG, WEBP и GIF.'));
    return;
  }

  cb(null, true);
}

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

const allowedExcelMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/octet-stream', // sometimes windows returns this for csv/xlsx
]);

function excelFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExcelMimeTypes.has(file.mimetype) && ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
    cb(new Error('Недопустимый формат файла. Разрешены только XLSX, XLS и CSV.'));
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

