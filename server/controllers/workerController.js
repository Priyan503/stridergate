import { calculatePremium } from '../utils/pricingEngine.js';

// ── In-memory worker store ────────────────────────────────────────
let workers = [
  { workerId: 'W001', name: 'Ravi Kumar',   city: 'Bengaluru', zone: 'Koramangala',  pincode: '560034', platform: 'Swiggy',  earnings: 4200, plan: 'Standard', premium: 67, bcs: 82, status: 'active',   claims: 2, joined: '2026-02-10', verified: true,  lat: 12.9352, lng: 77.6245 },
  { workerId: 'W002', name: 'Priya Sharma', city: 'Chennai',   zone: 'Anna Nagar',   pincode: '600040', platform: 'Zomato',  earnings: 3800, plan: 'Basic',    premium: 44, bcs: 91, status: 'active',   claims: 0, joined: '2026-01-28', verified: true,  lat: 13.0827, lng: 80.2187 },
  { workerId: 'W003', name: 'Arjun Mehta',  city: 'Mumbai',    zone: 'Andheri East', pincode: '400069', platform: 'Swiggy',  earnings: 5100, plan: 'Max',      premium: 96, bcs: 34, status: 'flagged',  claims: 5, joined: '2026-01-15', verified: false, lat: 19.1136, lng: 72.8697 },
  { workerId: 'W004', name: 'Deepa Nair',   city: 'Hyderabad', zone: 'Banjara Hills',pincode: '500034', platform: 'Zomato',  earnings: 3500, plan: 'Basic',    premium: 41, bcs: 74, status: 'active',   claims: 1, joined: '2026-02-20', verified: true,  lat: 17.4123, lng: 78.4480 },
];
let nextId = 5;

// GET /api/workers
export const getWorkers = (req, res) => {
  res.json({ success: true, data: workers });
};

// GET /api/workers/:id
export const getWorkerById = (req, res) => {
  const worker = workers.find(w => w.workerId === req.params.id);
  if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
  res.json({ success: true, data: worker });
};

// POST /api/workers — onboard a new worker
export const createWorker = (req, res) => {
  const { name, city, zone, pincode, platform, earnings, plan, bcs } = req.body;
  if (!name || !city || !zone || !platform || !earnings)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  const pricing   = calculatePremium({ plan: plan || 'Standard', zone, city, platform, earnings: Number(earnings), bcs: bcs || 75 });
  const newWorker = {
    workerId: `W${String(nextId++).padStart(3, '0')}`,
    name, city, zone,
    pincode:  pincode || '',
    platform,
    earnings: Number(earnings),
    plan:     plan || 'Standard',
    premium:  pricing.premium,
    bcs:      75,
    status:   'active',
    claims:   0,
    joined:   new Date().toISOString().split('T')[0],
    verified: false,
    lat:      null,
    lng:      null,
  };
  workers.push(newWorker);
  res.status(201).json({ success: true, data: newWorker, pricing });
};

// PATCH /api/workers/:id/verify — admin verifies worker
export const verifyWorker = (req, res) => {
  const worker = workers.find(w => w.workerId === req.params.id);
  if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
  worker.verified = true;
  worker.status   = 'active';
  res.json({ success: true, data: worker, message: `${worker.name} verified successfully` });
};

// PATCH /api/workers/:id/status — admin changes status
export const updateWorkerStatus = (req, res) => {
  const { status } = req.body;
  const worker = workers.find(w => w.workerId === req.params.id);
  if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
  if (!['active', 'flagged', 'suspended'].includes(status))
    return res.status(400).json({ success: false, error: 'Invalid status' });
  worker.status = status;
  res.json({ success: true, data: worker });
};

// GET /api/workers/:id/pricing — get full pricing breakdown for a worker
export const getWorkerPricing = (req, res) => {
  const worker = workers.find(w => w.workerId === req.params.id);
  if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
  const pricing = calculatePremium({
    plan: worker.plan, zone: worker.zone, city: worker.city,
    platform: worker.platform, earnings: worker.earnings, bcs: worker.bcs,
  });
  res.json({ success: true, data: { worker, pricing } });
};
