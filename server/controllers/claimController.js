import { analyzeBCS, getClaimStatus } from '../utils/bcsEngine.js';

// ── In-memory claim store ─────────────────────────────────────────
let claims = [
  { claimId: 'CLM-0042', workerId: 'W001', worker: 'Ravi Kumar',   zone: 'Koramangala',  trigger: 'Heavy Rain',  amount: 280, status: 'paid',     bcs: 82, time: '14:32', date: 'Apr 3',  adminNote: '' },
  { claimId: 'CLM-0041', workerId: 'W004', worker: 'Deepa Nair',   zone: 'Banjara Hills',trigger: 'Heavy Rain',  amount: 210, status: 'paid',     bcs: 74, time: '11:20', date: 'Apr 3',  adminNote: '' },
  { claimId: 'CLM-0040', workerId: 'W003', worker: 'Arjun Mehta',  zone: 'Andheri East', trigger: 'Heavy Rain',  amount: 380, status: 'flagged',  bcs: 34, time: '09:15', date: 'Apr 2',  adminNote: 'GPS anomaly detected' },
  { claimId: 'CLM-0039', workerId: 'W001', worker: 'Ravi Kumar',   zone: 'Koramangala',  trigger: 'Severe AQI', amount: 180, status: 'paid',     bcs: 88, time: '16:50', date: 'Mar 28', adminNote: '' },
  { claimId: 'CLM-0038', workerId: 'W003', worker: 'Arjun Mehta',  zone: 'Andheri East', trigger: 'Heavy Rain',  amount: 380, status: 'rejected', bcs: 28, time: '08:00', date: 'Mar 25', adminNote: 'Fraud pattern confirmed' },
];
let nextClaimNum = 43;

// GET /api/claims — all claims (admin) or filtered
export const getClaims = (req, res) => {
  res.json({ success: true, data: claims });
};

// GET /api/claims/worker/:workerId — worker sees only their own claims
export const getWorkerClaims = (req, res) => {
  const workerClaims = claims.filter(c => c.workerId === req.params.workerId);
  res.json({ success: true, data: workerClaims });
};

// GET /api/claims/:id
export const getClaimById = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
  res.json({ success: true, data: claim });
};

// POST /api/claims — create a new claim
export const createClaim = (req, res) => {
  const { worker, workerId, zone, trigger, amount, bcs } = req.body;
  if (!worker || !zone || !trigger || !amount)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  const bcsScore = bcs || 75;
  const status   = getClaimStatus(bcsScore);
  const analysis = analyzeBCS(bcsScore);
  const now      = new Date();

  const newClaim = {
    claimId:   `CLM-${String(nextClaimNum++).padStart(4, '0')}`,
    workerId:  workerId || 'unknown',
    worker,
    zone,
    trigger,
    amount:    Number(amount),
    status,
    bcs:       bcsScore,
    time:      now.toTimeString().slice(0, 5),
    date:      now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    adminNote: '',
  };

  claims.unshift(newClaim);
  res.status(201).json({ success: true, data: newClaim, analysis });
};

// PATCH /api/claims/:id/approve — admin approves a claim
export const approveClaim = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
  claim.status    = 'paid';
  claim.adminNote = req.body.note || 'Manually approved by admin';
  res.json({ success: true, data: claim, message: `Claim ${claim.claimId} approved — payout ₹${claim.amount} initiated` });
};

// PATCH /api/claims/:id/reject — admin rejects a claim
export const rejectClaim = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
  claim.status    = 'rejected';
  claim.adminNote = req.body.note || 'Rejected by admin';
  res.json({ success: true, data: claim });
};

// POST /api/claims/:id/analyze — run BCS analysis
export const analyzeClaim = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
  const analysis = analyzeBCS(claim.bcs);
  res.json({ success: true, data: { claim, analysis } });
};
