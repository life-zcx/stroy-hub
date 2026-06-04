import express from 'express';
import {
  getProductReviews,
  createProductReview,
  adminGetReviews,
  adminApproveReview,
  adminDeleteReview
} from '../controllers/reviewController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Получить отзывы для товара (публичный доступ)
router.get('/product/:productId', getProductReviews);

// Добавить отзыв для товара (только для авторизованных пользователей)
router.post('/product/:productId', verifyToken, createProductReview);

// Администрирование отзывов (только для администраторов)
router.get('/', verifyToken, requireRoles(['ADMIN']), adminGetReviews);
router.patch('/:reviewId/approve', verifyToken, requireRoles(['ADMIN']), adminApproveReview);
router.delete('/:reviewId', verifyToken, requireRoles(['ADMIN']), adminDeleteReview);

export default router;
