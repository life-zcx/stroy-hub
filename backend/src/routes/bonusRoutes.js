import express from 'express';
import {
  getUserBonusSummary,
  getBonusHistory,
  manualAdjustBonus,
} from '../controllers/bonusController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bonuses/summary — текущий баланс и статистика
router.get('/summary', verifyToken, getUserBonusSummary);

// GET /api/bonuses/history — история транзакций (с пагинацией)
router.get('/history', verifyToken, getBonusHistory);

// POST /api/bonuses/admin/adjust — ручная корректировка (только ADMIN)
router.post('/admin/adjust', verifyToken, requireRoles(['ADMIN']), manualAdjustBonus);

export default router;
