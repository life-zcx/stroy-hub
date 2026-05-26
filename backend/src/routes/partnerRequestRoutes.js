import express from 'express';
import {
  createPartnerRequest,
  getAllPartnerRequests,
  updatePartnerRequest,
} from '../controllers/partnerRequestController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createPartnerRequest);
router.get('/', verifyToken, requireRoles(['ADMIN']), getAllPartnerRequests);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), updatePartnerRequest);

export default router;
