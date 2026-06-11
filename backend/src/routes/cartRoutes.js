import express from 'express';
import { 
  getCart, addToCart, updateCartItem, removeFromCart, syncCart, clearCart 
} from '../controllers/cartController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all cart endpoints
router.use(verifyToken);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.post('/sync', syncCart);
router.delete('/', clearCart);

export default router;
