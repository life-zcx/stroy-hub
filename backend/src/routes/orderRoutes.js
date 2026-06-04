import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  getUserBonuses
} from '../controllers/orderController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllOrders);
router.get('/bonuses', verifyToken, getUserBonuses);
router.get('/:id', verifyToken, getOrderById);
router.post('/', verifyToken, createOrder);
router.put('/:id/status', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), updateOrderStatus);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), updateOrder);

export default router;
