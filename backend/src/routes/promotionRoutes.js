import express from 'express';
import {
  createPromotion,
  deletePromotion,
  getAllPromotions,
  getHomePromotions,
  getPublicPromotions,
  updatePromotion,
  validatePromotionCode,
  getMyPromotions,
} from '../controllers/promotionController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';
import { imageUpload } from '../config/upload.js';

const router = express.Router();

router.get('/public', getPublicPromotions);
router.get('/home', getHomePromotions);
router.get('/my', verifyToken, getMyPromotions);
router.post('/validate', validatePromotionCode);

const uploadFields = imageUpload.fields([
  { name: 'imageCardFile', maxCount: 1 },
  { name: 'imageDetailFile', maxCount: 1 }
]);

router.get('/', verifyToken, requireRoles(['ADMIN']), getAllPromotions);
router.post('/', verifyToken, requireRoles(['ADMIN']), uploadFields, createPromotion);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), uploadFields, updatePromotion);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deletePromotion);

export default router;
