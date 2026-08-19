import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getMyReferralSummary, validateReferralCode } from '../controllers/referralController.js';

const router = express.Router();

// Protected user endpoint for referral dashboard
router.get('/summary', verifyToken, getMyReferralSummary);

// Public validation endpoint for referral code check
router.post('/validate', validateReferralCode);

export default router;
