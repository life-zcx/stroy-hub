import express from 'express';
import { handleAiChat, handleParseEstimateOcr, handleResetCache } from '../controllers/aiController.js';
import { handleFillProductCard } from '../controllers/productFillController.js';

const router = express.Router();

router.post('/chat', handleAiChat);
router.post('/fill-product', handleFillProductCard);
router.post('/ocr-estimate', handleParseEstimateOcr);
router.post('/reset-cache', handleResetCache);

export default router;
