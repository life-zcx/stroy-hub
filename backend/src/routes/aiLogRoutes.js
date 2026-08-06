import express from 'express';
import { logAiChat, getUserAiChatHistory } from '../controllers/aiLogController.js';

const router = express.Router();

router.post('/log', logAiChat);
router.get('/history', getUserAiChatHistory);

export default router;
