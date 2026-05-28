import express from 'express';
import { createAnalyticsEvent, createPageView, getAnalyticsSummary } from '../controllers/analyticsController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/page-view', createPageView);
router.post('/event', createAnalyticsEvent);
router.get('/summary', verifyToken, requireRoles(['ADMIN']), getAnalyticsSummary);

export default router;
