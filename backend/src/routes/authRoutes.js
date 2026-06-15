import express from 'express';
import { register, login, logout, getProfile, updateProfile, forgotPassword, resetPassword, sendRegisterCode } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { registerRateLimiter, loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerRateLimiter, register);
router.post('/send-register-code', registerRateLimiter, sendRegisterCode);
router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/me', verifyToken, getProfile);
router.put('/me', verifyToken, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
