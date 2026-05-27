import express from 'express';
import { createOrder, getAllOrders, updateOrderStatus, updateOrder } from '../controllers/orderController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllOrders);
router.post('/', verifyToken, createOrder);
router.put('/:id/status', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), updateOrderStatus);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), updateOrder);

export default router;
