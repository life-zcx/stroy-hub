import express from 'express';
import { createCallback, getAllCallbacks, updateCallback } from '../controllers/callbackController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Public: Create callback request
router.post('/', createCallback);

// Admin only: Management
router.get('/', verifyToken, requireRoles(['ADMIN']), getAllCallbacks);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), updateCallback);

export default router;
