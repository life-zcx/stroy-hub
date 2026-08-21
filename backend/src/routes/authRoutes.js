import express from 'express';
import { register, login, logout, refreshToken, getProfile, updateProfile, forgotPassword, resetPassword, sendRegisterCode, verifyResetCode, deleteAccount } from '../controllers/authController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { registerRateLimiter, loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validate.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/register', registerRateLimiter, validateRequest(registerSchema), register);
router.post('/send-register-code', registerRateLimiter, sendRegisterCode);
router.post('/login', loginRateLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', optionalAuth, getProfile);
router.put('/me', verifyToken, updateProfile);
router.delete('/me', verifyToken, deleteAccount);
router.post('/forgot-password', passwordResetRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-code', passwordResetRateLimiter, verifyResetCode);
router.post('/reset-password', passwordResetRateLimiter, validateRequest(resetPasswordSchema), resetPassword);

export default router;
