/**
 * Auth Controller — MongoDB-backed login
 * Roles: 'worker' (sees own data only) | 'admin' (sees everything)
 */

import jwt from 'jsonwebtoken';
import Worker from '../models/Worker.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shielded-rider-demo-secret-2026';

// GET /api/auth/workers — list workers for login selection
export const getDemoWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ insurance_active: true })
      .select('workerId name platform city zone plan premium premium_amount bcs trust_score')
      .sort({ workerId: 1 })
      .lean();
    res.json({ success: true, data: workers });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { role, workerId } = req.body;

  if (!role || !['worker', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role. Must be "worker" or "admin".' });
  }

  if (role === 'worker') {
    if (!workerId) return res.status(400).json({ success: false, error: 'workerId required for worker login' });

    try {
      const worker = await Worker.findOne({ workerId }).lean();
      if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

      const token = jwt.sign({ role: 'worker', workerId, name: worker.name }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ success: true, token, role: 'worker', user: worker });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  // Admin login
  const token = jwt.sign({ role: 'admin', name: 'Admin' }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ success: true, token, role: 'admin', user: { name: 'Shielded Rider Admin', workerId: null } });
};

// GET /api/auth/verify — check token validity
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
