import express from 'express';
import { createAnalyticsEvent, createPageView, getAnalyticsSummary } from '../controllers/analyticsController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';
import { analyticsRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate-limited ingest endpoints — open to the public but capped to prevent spam / DB flooding
router.post('/page-view', analyticsRateLimiter, createPageView);
router.post('/event', analyticsRateLimiter, createAnalyticsEvent);
router.get('/summary', verifyToken, requireRoles(['ADMIN']), getAnalyticsSummary);

export default router;

