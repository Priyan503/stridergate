import { Router } from 'express';
import { getTriggers, simulateTrigger, resetTrigger } from '../controllers/triggerController.js';

const router = Router();

router.get('/', getTriggers);
router.post('/:id/simulate', simulateTrigger);
router.post('/:id/reset', resetTrigger);

export default router;
