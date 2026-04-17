import { Router } from 'express';
import { createOrder, verifyPayment, processPayout, getPayments } from '../controllers/paymentController.js';

const router = Router();
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/payout/:claimId', processPayout);
router.get('/', getPayments);
export default router;
