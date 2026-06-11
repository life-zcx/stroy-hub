import express from 'express';
import {
  createReturnRequest,
  getMyReturnRequests,
  getAllReturnRequests,
  updateReturnRequestStatus
} from '../controllers/returnRequestController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { imageUpload } from '../config/upload.js';

const router = express.Router();

// Client routes
router.post('/', verifyToken, imageUpload.single('photoFile'), createReturnRequest);
router.get('/my', verifyToken, getMyReturnRequests);

// Admin routes
router.get('/', verifyToken, requireRoles(['ADMIN']), getAllReturnRequests);
router.put('/:id/status', verifyToken, requireRoles(['ADMIN']), updateReturnRequestStatus);

export default router;
