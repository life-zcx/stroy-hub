import express from 'express';
import { getDynamicSitemap } from '../controllers/sitemapController.js';

const router = express.Router();

router.get('/', getDynamicSitemap);

export default router;
