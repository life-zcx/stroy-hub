import express from 'express';
import { 
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getPricingSettings, savePricingSettings, importProductsXlsx, matchEstimateXlsx,
  getProductStats, getPriceLogs, getAiCatalogProducts
} from '../controllers/productController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { estimateUploadRateLimiter } from '../middleware/rateLimiter.js';
import { imageUpload, excelUpload } from '../config/upload.js';

import { getCartRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// Pricing settings, recommendations & logs routes (Must be registered BEFORE /:id)
router.get('/pricing/settings', verifyToken, requireRoles(['ADMIN']), getPricingSettings);
router.post('/pricing/settings', verifyToken, requireRoles(['ADMIN']), savePricingSettings);
router.get('/pricing/logs', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), getPriceLogs);
router.get('/ai-catalog', getAiCatalogProducts);
router.get('/recommendations', getCartRecommendations);

// Public endpoints
router.get('/', getAllProducts);
router.post('/match-estimate', verifyToken, estimateUploadRateLimiter, excelUpload.single('file'), matchEstimateXlsx);
router.get('/:id', getProductById);
router.get('/:id/stats', getProductStats);

// Bulk product imports
router.post('/import-xlsx', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), excelUpload.single('file'), importProductsXlsx);

// Protected endpoints for administrators and suppliers only
router.post('/', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'additionalImageFiles', maxCount: 30 }]), createProduct);
router.put('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), imageUpload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'additionalImageFiles', maxCount: 30 }]), updateProduct);
router.delete('/:id', verifyToken, requireRoles(['ADMIN', 'SUPPLIER']), deleteProduct);

export default router;
