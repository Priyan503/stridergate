import { Router } from 'express';
import { login, getDemoWorkers, verifyToken } from '../controllers/authController.js';

const router = Router();
router.get('/workers', getDemoWorkers);
router.post('/login', login);
router.get('/verify', verifyToken);
export default router;
