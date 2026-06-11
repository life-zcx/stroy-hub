import express from 'express';
import { getProductOg, getCatalogOg } from '../controllers/ogController.js';

const router = express.Router();

router.get('/product/:id', getProductOg);
router.get('/catalog/:slug', getCatalogOg);

export default router;
