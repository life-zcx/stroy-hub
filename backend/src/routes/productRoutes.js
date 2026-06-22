import express from 'express';
import { 
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getPricingSettings, savePricingSettings, importProductsXlsx, matchEstimateXlsx
} from '../controllers/productController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { estimateUploadRateLimiter } from '../middleware/rateLimiter.js';
import { imageUpload, excelUpload } from '../config/upload.js';

const router = express.Router();

// Pricing settings routes (Must be registered BEFORE /:id)
router.get('/pricing/settings', verifyToken, requireRoles(['ADMIN']), getPricingSettings);
router.post('/pricing/settings', verifyToken, requireRoles(['ADMIN']), savePricingSettings);

// Public endpoints
router.get('/', getAllProducts);
router.post('/match-estimate', verifyToken, estimateUploadRateLimiter, excelUpload.single('file'), matchEstimateXlsx);
router.get('/:id', getProductById);

// Bulk product imports
router.post('/import-xlsx', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), excelUpload.single('file'), importProductsXlsx);

// Protected endpoints for administrators and suppliers only
router.post('/', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'additionalImageFiles', maxCount: 30 }]), createProduct);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'additionalImageFiles', maxCount: 30 }]), updateProduct);
router.delete('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), deleteProduct);

export default router;
