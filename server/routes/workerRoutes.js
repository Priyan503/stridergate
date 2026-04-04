import { Router } from 'express';
import { getWorkers, getWorkerById, createWorker } from '../controllers/workerController.js';

const router = Router();

router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/', createWorker);

export default router;
