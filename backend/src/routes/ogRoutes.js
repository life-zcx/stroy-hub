import express from 'express';
import { getProductOg, getCatalogOg, getStaticPageOg } from '../controllers/ogController.js';

const router = express.Router();

router.get('/product/:id', getProductOg);
router.get('/catalog/:slug', getCatalogOg);
router.get('/page/:page', getStaticPageOg);

export default router;

