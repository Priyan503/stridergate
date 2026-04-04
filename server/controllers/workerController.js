import { calculatePremium } from '../utils/pricingEngine.js';

// ── In-memory store (fallback when MongoDB is unavailable) ───
let workers = [
  { workerId: 'W001', name: 'Ravi Kumar', city: 'Bengaluru', zone: 'Koramangala', pincode: '560034', platform: 'Swiggy', earnings: 4200, plan: 'Standard', premium: 67, bcs: 82, status: 'active', claims: 2, joined: '2026-02-10' },
  { workerId: 'W002', name: 'Priya Sharma', city: 'Chennai', zone: 'Anna Nagar', pincode: '600040', platform: 'Zomato', earnings: 3800, plan: 'Basic', premium: 44, bcs: 91, status: 'active', claims: 0, joined: '2026-01-28' },
  { workerId: 'W003', name: 'Arjun Mehta', city: 'Mumbai', zone: 'Andheri East', pincode: '400069', platform: 'Swiggy', earnings: 5100, plan: 'Max', premium: 96, bcs: 34, status: 'flagged', claims: 5, joined: '2026-01-15' },
  { workerId: 'W004', name: 'Deepa Nair', city: 'Hyderabad', zone: 'Banjara Hills', pincode: '500034', platform: 'Zomato', earnings: 3500, plan: 'Basic', premium: 41, bcs: 74, status: 'active', claims: 1, joined: '2026-02-20' },
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

// POST /api/workers — Onboard a new worker
export const createWorker = (req, res) => {
  const { name, city, zone, pincode, platform, earnings, plan } = req.body;

  if (!name || !city || !zone || !platform || !earnings) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const pricing = calculatePremium({ plan: plan || 'Standard', zone });

  const newWorker = {
    workerId: `W${String(nextId++).padStart(3, '0')}`,
    name,
    city,
    zone,
    pincode: pincode || '',
    platform,
    earnings: Number(earnings),
    plan: plan || 'Standard',
    premium: pricing.premium,
    bcs: 75,
    status: 'active',
    claims: 0,
    joined: new Date().toISOString().split('T')[0],
  };

  workers.push(newWorker);

  res.status(201).json({
    success: true,
    data: newWorker,
    pricing,
  });
};
