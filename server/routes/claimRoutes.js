import { Router } from 'express';
import {
  getClaims, getClaimById, getWorkerClaims,
  createClaim, analyzeClaim, approveClaim, rejectClaim
} from '../controllers/claimController.js';

const router = Router();
router.get('/', getClaims);
router.get('/worker/:workerId', getWorkerClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.post('/:id/analyze', analyzeClaim);
router.patch('/:id/approve', approveClaim);
router.patch('/:id/reject', rejectClaim);
export default router;
