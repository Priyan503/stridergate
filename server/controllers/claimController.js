import { analyzeBCS, getClaimStatus } from '../utils/bcsEngine.js';

// ── In-memory store ──────────────────────────────────────────
let claims = [
  { claimId: 'CLM-0042', worker: 'Ravi Kumar', zone: 'Koramangala', trigger: 'Heavy Rain', amount: 280, status: 'paid', bcs: 82, time: '14:32', date: 'Mar 18' },
  { claimId: 'CLM-0041', worker: 'Deepa Nair', zone: 'Banjara Hills', trigger: 'Heavy Rain', amount: 210, status: 'paid', bcs: 74, time: '11:20', date: 'Mar 18' },
  { claimId: 'CLM-0040', worker: 'Arjun Mehta', zone: 'Andheri East', trigger: 'Heavy Rain', amount: 380, status: 'flagged', bcs: 34, time: '09:15', date: 'Mar 17' },
  { claimId: 'CLM-0039', worker: 'Ravi Kumar', zone: 'Koramangala', trigger: 'Severe AQI', amount: 180, status: 'paid', bcs: 88, time: '16:50', date: 'Mar 12' },
  { claimId: 'CLM-0038', worker: 'Arjun Mehta', zone: 'Andheri East', trigger: 'Heavy Rain', amount: 380, status: 'rejected', bcs: 28, time: '08:00', date: 'Mar 10' },
];

let nextClaimNum = 43;

// GET /api/claims
export const getClaims = (req, res) => {
  res.json({ success: true, data: claims });
};

// GET /api/claims/:id
export const getClaimById = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
  res.json({ success: true, data: claim });
};

// POST /api/claims — Create a new claim (auto-processed via BCS)
export const createClaim = (req, res) => {
  const { worker, zone, trigger, amount, bcs } = req.body;

  if (!worker || !zone || !trigger || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const bcsScore = bcs || 75;
  const status = getClaimStatus(bcsScore);
  const analysis = analyzeBCS(bcsScore);

  const now = new Date();
  const newClaim = {
    claimId: `CLM-${String(nextClaimNum++).padStart(4, '0')}`,
    worker,
    zone,
    trigger,
    amount: Number(amount),
    status,
    bcs: bcsScore,
    time: now.toTimeString().slice(0, 5),
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };

  claims.unshift(newClaim);

  res.status(201).json({
    success: true,
    data: newClaim,
    analysis,
  });
};

// POST /api/claims/:id/analyze — Run BCS analysis on an existing claim
export const analyzeClaim = (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.id);
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

  const analysis = analyzeBCS(claim.bcs);
  res.json({ success: true, data: { claim, analysis } });
};
