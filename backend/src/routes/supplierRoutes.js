import express from 'express';
import { 
  getAllSuppliers, createSupplier, updateSupplier, deleteSupplier 
} from '../controllers/supplierController.js';
import { requireRoles, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllSuppliers);
router.post('/', verifyToken, requireRoles(['ADMIN']), createSupplier);
router.put('/:id', verifyToken, requireRoles(['ADMIN']), updateSupplier);
router.delete('/:id', verifyToken, requireRoles(['ADMIN']), deleteSupplier);

export default router;
