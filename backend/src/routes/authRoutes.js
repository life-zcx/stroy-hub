import express from 'express';
import { register, login, getProfile, forgotPassword, resetPassword, sendRegisterCode } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { registerRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerRateLimiter, register);
router.post('/send-register-code', registerRateLimiter, sendRegisterCode);
router.post('/login', login);
router.get('/me', verifyToken, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
