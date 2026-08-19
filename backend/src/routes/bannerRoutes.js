import express from 'express';
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  getPublicBanners,
  updateBanner,
} from '../controllers/bannerController.js';
import { imageUpload } from '../config/upload.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

const bannerUploadMiddleware = imageUpload.fields([
  { name: 'imageDesktopFile', maxCount: 1 },
  { name: 'imageMobileFile', maxCount: 1 },
]);

router.get('/public', getPublicBanners);
router.get('/', verifyToken, requireRoles(['ADMIN']), getAllBanners);
router.post('/', verifyToken, requireRoles(['ADMIN']), bannerUploadMiddleware, createBanner);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), bannerUploadMiddleware, updateBanner);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteBanner);

export default router;
