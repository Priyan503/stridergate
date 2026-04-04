/**
 * Payment Controller — Razorpay premium payments + claim payouts
 */

import {
  createPremiumOrder,
  verifyPaymentSignature,
  initiateClaimPayout,
} from '../services/paymentService.js';

// In-memory payment ledger
const payments = [];

// POST /api/payments/create-order — worker pays premium
export const createOrder = async (req, res) => {
  try {
    const { amount, workerId, planName } = req.body;
    if (!amount || !workerId) return res.status(400).json({ success: false, error: 'amount and workerId required' });

    const order = await createPremiumOrder({ amount: Number(amount), workerId, planName });
    payments.push({ ...order, type: 'premium', workerId, createdAt: new Date().toISOString(), status: 'created' });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/payments/verify — verify payment after checkout
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, workerId } = req.body;
    const result = await verifyPaymentSignature({ orderId, paymentId, signature });

    if (result.verified) {
      const idx = payments.findIndex(p => p.orderId === orderId);
      if (idx !== -1) payments[idx].status = 'paid';

      return res.json({ success: true, data: { verified: true, paymentId, message: 'Premium activated!' } });
    }

    res.status(400).json({ success: false, error: 'Payment verification failed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/payments/payout/:claimId — admin triggers claim payout
export const processPayout = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { workerId, amount } = req.body;

    if (!workerId || !amount) return res.status(400).json({ success: false, error: 'workerId and amount required' });

    const payout = await initiateClaimPayout({ workerId, amount: Number(amount), claimId });
    payments.push({ ...payout, type: 'payout', claimId, createdAt: new Date().toISOString() });

    res.json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/payments — list all transactions (admin only)
export const getPayments = (req, res) => {
  res.json({ success: true, data: payments });
};
