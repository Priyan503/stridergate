import { Router } from 'express';
import { getClaims, getClaimById, createClaim, analyzeClaim } from '../controllers/claimController.js';

const router = Router();

router.get('/', getClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.post('/:id/analyze', analyzeClaim);

export default router;
