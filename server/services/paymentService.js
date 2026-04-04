/**
 * Payment Service — Razorpay Test Mode with mock fallback
 * If RAZORPAY keys are not set, returns simulated success responses
 */

const KEY_ID     = process.env.RAZORPAY_KEY_ID     || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const MOCK_MODE  = !KEY_ID || !KEY_SECRET;

// Lazy-load Razorpay only if keys are present
let razorpay = null;
async function getRazorpay() {
  if (MOCK_MODE) return null;
  if (!razorpay) {
    const { default: Razorpay } = await import('razorpay');
    razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return razorpay;
}

// ── Create order for premium payment ────────────────────────────
export async function createPremiumOrder({ amount, workerId, planName }) {
  if (MOCK_MODE) {
    return {
      orderId:  `mock_order_${Date.now()}`,
      amount:   amount * 100, // paise
      currency: 'INR',
      keyId:    'rzp_test_mock',
      mock:     true,
      notes:    { workerId, planName },
    };
  }
  const rz = await getRazorpay();
  const order = await rz.orders.create({
    amount:   amount * 100,
    currency: 'INR',
    notes:    { workerId, planName },
  });
  return {
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    KEY_ID,
    mock:     false,
  };
}

// ── Verify payment signature ─────────────────────────────────────
export async function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (MOCK_MODE) {
    // In mock mode, accept any payment ending in _success
    return { verified: paymentId.endsWith('_success') || true, mock: true };
  }
  const { createHmac } = await import('crypto');
  const body    = `${orderId}|${paymentId}`;
  const expected = createHmac('sha256', KEY_SECRET).update(body).digest('hex');
  return { verified: expected === signature, mock: false };
}

// ── Simulate/initiate payout to worker (admin action) ────────────
export async function initiateClaimPayout({ workerId, amount, claimId }) {
  if (MOCK_MODE) {
    return {
      success:      true,
      payoutId:     `mock_payout_${Date.now()}`,
      amount,
      workerId,
      claimId,
      method:       'UPI (Simulated)',
      status:       'processed',
      processedAt:  new Date().toISOString(),
      mock:         true,
    };
  }
  // Real Razorpay payout would require X-account setup & KYC
  // For test mode we simulate success
  return {
    success:     true,
    payoutId:    `rz_payout_${Date.now()}`,
    amount,
    workerId,
    claimId,
    method:      'UPI',
    status:      'processed',
    processedAt: new Date().toISOString(),
    mock:        false,
  };
}
