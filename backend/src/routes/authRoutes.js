import express from 'express';
import { register, login, logout, getProfile, updateProfile, forgotPassword, resetPassword, sendRegisterCode, verifyResetCode, deleteAccount } from '../controllers/authController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { registerRateLimiter, loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerRateLimiter, register);
router.post('/send-register-code', registerRateLimiter, sendRegisterCode);
router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/me', optionalAuth, getProfile);
router.put('/me', verifyToken, updateProfile);
router.delete('/me', verifyToken, deleteAccount);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/verify-reset-code', passwordResetRateLimiter, verifyResetCode);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);

export default router;
