import express from 'express';
import { 
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory 
} from '../controllers/categoryController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { imageUpload } from '../config/upload.js';

const router = express.Router();

// Public endpoints
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-only endpoints for Category CRUD with file uploads
router.post('/', verifyToken, requireRoles(['ADMIN']), imageUpload.single('imageFile'), createCategory);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), imageUpload.single('imageFile'), updateCategory);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteCategory);

export default router;
