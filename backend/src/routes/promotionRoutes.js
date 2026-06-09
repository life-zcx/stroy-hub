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

router.get('/', verifyToken, requireRoles(['ADMIN']), getAllPromotions);
router.post('/', verifyToken, requireRoles(['ADMIN']), imageUpload.single('imageFile'), createPromotion);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), imageUpload.single('imageFile'), updatePromotion);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deletePromotion);

export default router;
