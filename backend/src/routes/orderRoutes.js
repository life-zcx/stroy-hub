import express from 'express';
import { createOrder, getAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllOrders);
router.post('/', verifyToken, createOrder);
router.put('/:id/status', verifyToken, updateOrderStatus);

export default router;
