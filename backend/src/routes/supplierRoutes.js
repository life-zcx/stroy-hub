import express from 'express';
import { 
  getAllSuppliers, createSupplier, updateSupplier, deleteSupplier 
} from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', getAllSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
