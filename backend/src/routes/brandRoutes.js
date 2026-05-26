import express from 'express';
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getPublicBrands,
  updateBrand,
} from '../controllers/brandController.js';
import { imageUpload } from '../config/upload.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicBrands);
router.get('/', verifyToken, requireRoles(['ADMIN']), getAllBrands);
router.post('/', verifyToken, requireRoles(['ADMIN']), imageUpload.single('logoFile'), createBrand);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), imageUpload.single('logoFile'), updateBrand);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteBrand);

export default router;
