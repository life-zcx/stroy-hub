import express from 'express';
import { register, login, getProfile, forgotPassword, resetPassword, sendRegisterCode } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/send-register-code', sendRegisterCode);
router.post('/login', login);
router.get('/me', verifyToken, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
