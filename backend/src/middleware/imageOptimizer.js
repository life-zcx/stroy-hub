import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

let sharp = null;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default || sharpModule;
} catch (e) {
  logger.warn(`[IMAGE OPTIMIZER] Optional dependency 'sharp' not installed in node_modules yet.`);
}

/**
 * Middleware to convert uploaded multer images to WebP format and compress them.
 */
export const optimizeImage = async (req, res, next) => {
  if (!sharp || (!req.file && (!req.files || req.files.length === 0))) {
    return next();
  }

  const processSingleFile = async (file) => {
    if (!file || !file.path) return;
    
    // Skip if already webp
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.svg' || ext === '.webp') return;

    try {
      const outputDir = path.dirname(file.path);
      const filenameWithoutExt = path.basename(file.filename, ext);
      const webpFilename = `${filenameWithoutExt}.webp`;
      const webpPath = path.join(outputDir, webpFilename);

      await sharp(file.path)
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);

      // Clean up original file if different
      if (fs.existsSync(file.path) && file.path !== webpPath) {
        fs.unlinkSync(file.path);
      }

      // Mutate file metadata to point to new webp file
      file.filename = webpFilename;
      file.path = webpPath;
      file.mimetype = 'image/webp';
    } catch (err) {
      logger.error(`[IMAGE OPTIMIZER] Error converting ${file.filename} to WebP: ${err.message}`);
    }
  };

  try {
    if (req.file) {
      await processSingleFile(req.file);
    }
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        await processSingleFile(file);
      }
    }
    next();
  } catch (err) {
    logger.error(`[IMAGE OPTIMIZER] Middleware error: ${err.message}`);
    next();
  }
};
