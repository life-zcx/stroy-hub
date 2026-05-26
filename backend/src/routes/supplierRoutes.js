import express from 'express';
import { getAllSuppliers, createSupplier } from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', getAllSuppliers);
router.post('/', createSupplier);

export default router;
