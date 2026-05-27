import express from 'express';
import { 
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getPricingSettings, savePricingSettings 
} from '../controllers/productController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { imageUpload } from '../config/upload.js';

const router = express.Router();

// Pricing settings routes (Must be registered BEFORE /:id)
router.get('/pricing/settings', getPricingSettings);
router.post('/pricing/settings', verifyToken, requireRoles(['ADMIN']), savePricingSettings);

// Public endpoints
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected endpoints for administrators and suppliers only
router.post('/', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.single('imageFile'), createProduct);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.single('imageFile'), updateProduct);
router.delete('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), deleteProduct);

export default router;
