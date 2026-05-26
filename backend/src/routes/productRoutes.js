import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
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
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected endpoints for administrators and suppliers only
router.post('/', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), upload.single('imageFile'), createProduct);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), upload.single('imageFile'), updateProduct);
router.delete('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), deleteProduct);

export default router;
