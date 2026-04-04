import { Router } from 'express';
import { getWeather, checkTriggers } from '../controllers/weatherController.js';

const router = Router();
router.get('/check-triggers', checkTriggers);
router.get('/:city', getWeather);
export default router;
