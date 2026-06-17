import express from 'express';
import {
  createUserByAdmin,
  getAllUsers,
  updateUser,
  updateUserBlockStatus,
  updateUserPassword,
  getUserPortrait,
  addUserCartItem,
  updateUserCartItem,
  removeUserCartItem,
  clearUserCart,
} from '../controllers/userController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireRoles(['ADMIN']));

router.get('/', getAllUsers);
router.get('/:id/portrait', getUserPortrait);
router.post('/', createUserByAdmin);
router.put('/:id', updateUser);
router.put('/:id/password', updateUserPassword);
router.put('/:id/block', updateUserBlockStatus);

// Cart administration routes
router.post('/:id/cart', addUserCartItem);
router.put('/:id/cart/:productId', updateUserCartItem);
router.delete('/:id/cart/:productId', removeUserCartItem);
router.delete('/:id/cart', clearUserCart);

export default router;

