import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Public: Get current system settings
router.get('/', getSettings);

// Admin only: Update system settings
router.post('/', verifyToken, requireRoles(['ADMIN']), updateSettings);

export default router;
