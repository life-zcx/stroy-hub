import express from 'express';
import { logAiChat, getUserAiChatHistory } from '../controllers/aiLogController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/log', logAiChat);
router.get('/history', optionalAuth, getUserAiChatHistory);

export default router;
