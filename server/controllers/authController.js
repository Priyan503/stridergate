/**
 * Auth Controller — Simple role-based login (no passwords for demo)
 * Roles: 'worker' (sees own data only) | 'admin' (sees everything)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gigshield-demo-secret-2026';

// Demo workers for login selection
export const DEMO_WORKERS = [
  { workerId: 'W001', name: 'Ravi Kumar',   platform: 'Swiggy', city: 'Bengaluru', zone: 'Koramangala' },
  { workerId: 'W002', name: 'Priya Sharma', platform: 'Zomato', city: 'Chennai',   zone: 'Anna Nagar'   },
  { workerId: 'W003', name: 'Arjun Mehta',  platform: 'Swiggy', city: 'Mumbai',    zone: 'Andheri East' },
  { workerId: 'W004', name: 'Deepa Nair',   platform: 'Zomato', city: 'Hyderabad', zone: 'Banjara Hills'},
];

// GET /api/auth/workers — list demo workers for login selection
export const getDemoWorkers = (req, res) => {
  res.json({ success: true, data: DEMO_WORKERS });
};

// POST /api/auth/login
export const login = (req, res) => {
  const { role, workerId } = req.body;

  if (!role || !['worker', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role. Must be "worker" or "admin".' });
  }

  if (role === 'worker') {
    if (!workerId) return res.status(400).json({ success: false, error: 'workerId required for worker login' });
    const worker = DEMO_WORKERS.find(w => w.workerId === workerId);
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

    const token = jwt.sign({ role: 'worker', workerId, name: worker.name }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token, role: 'worker', user: worker });
  }

  // Admin login
  const token = jwt.sign({ role: 'admin', name: 'Admin' }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ success: true, token, role: 'admin', user: { name: 'GigShield Admin', workerId: null } });
};

// POST /api/auth/verify — check token validity
export const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const token   = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, data: payload });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// ── Auth middleware ───────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    const token = authHeader.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
    next();
  });
}
