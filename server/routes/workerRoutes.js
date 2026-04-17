import { Router } from 'express';
import {
  getWorkers, getWorkerById, createWorker,
  verifyWorker, updateWorkerStatus, getWorkerPricing
} from '../controllers/workerController.js';

const router = Router();
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.get('/:id/pricing', getWorkerPricing);
router.post('/', createWorker);
router.patch('/:id/verify', verifyWorker);
router.patch('/:id/status', updateWorkerStatus);
export default router;
