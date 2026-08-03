import express from 'express';
import { logAiChat } from '../controllers/aiLogController.js';

const router = express.Router();

router.post('/log', logAiChat);

export default router;
