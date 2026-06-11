import express from 'express';
import {
  getAllWarrantyRules,
  createWarrantyRule,
  updateWarrantyRule,
  deleteWarrantyRule,
} from '../controllers/warrantyRuleController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated users to view rules (for calculating deadlines on client side)
router.get('/', verifyToken, getAllWarrantyRules);

// Only ADMIN can configure warranty rules
router.post('/', verifyToken, requireRoles(['ADMIN']), createWarrantyRule);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), updateWarrantyRule);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteWarrantyRule);

export default router;
