import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory 
} from '../controllers/categoryController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Public endpoints
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-only endpoints for Category CRUD with file uploads
router.post('/', verifyToken, requireRoles(['ADMIN']), upload.single('imageFile'), createCategory);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), upload.single('imageFile'), updateCategory);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteCategory);

export default router;
