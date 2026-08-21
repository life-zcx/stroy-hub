import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
} from '../controllers/orderController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/index.js';

const router = express.Router();

router.get('/', verifyToken, getAllOrders);
router.get('/:id', verifyToken, getOrderById);
router.post('/', verifyToken, validateRequest(createOrderSchema), createOrder);
router.post('/:id/cancel', verifyToken, cancelOrder);
router.put('/:id/status', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), validateRequest(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), updateOrder);

export default router;
