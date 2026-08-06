import express from 'express';
import { getClientGeoLocation } from '../controllers/geoController.js';

const router = express.Router();

router.get('/', getClientGeoLocation);

export default router;
