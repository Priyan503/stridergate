/**
 * Worker Controller — MongoDB-backed with dynamic pricing.
 */

import Worker from '../models/Worker.js';
import { calculatePremium } from '../utils/pricingEngine.js';
import { calculateDynamicPremium, getZoneRiskScore } from '../services/pricingService.js';

// ── GET /api/workers ──────────────────────────────────────────────
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch workers' });
  }
};

// ── GET /api/workers/:id ──────────────────────────────────────────
export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.id }).lean();
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch worker' });
  }
};

// ── POST /api/workers — onboard a new worker ─────────────────────
export const createWorker = async (req, res) => {
  try {
    const { name, city, zone, pincode, platform, earnings, plan, bcs, phone, lat, lng } = req.body;
    if (!name || !city || !zone || !platform || !earnings) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Dynamic pricing (use both engines for compatibility)
    const legacyPricing = calculatePremium({
      plan: plan || 'Standard', zone, city,
      platform, earnings: Number(earnings), bcs: bcs || 75,
    });

    const mlPricing = calculateDynamicPremium({
      zone,
      trustScore: 75,
      activityLevel: Math.round(Number(earnings) / 800),
      city,
    });

    // Generate unique worker ID
    const count = await Worker.countDocuments();
    const workerId = `W${String(count + 1).padStart(3, '0')}`;

    const newWorker = await Worker.create({
      workerId,
      name,
      city,
      zone,
      pincode: pincode || '',
      platform,
      earnings: Number(earnings),
      plan: plan || 'Standard',
      premium: legacyPricing.premium,
      premium_amount: mlPricing.premium_inr,
      bcs: 75,
      trust_score: 75,
      trust_level: 'new',
      spoofing_score: 0,
      risk_zone_score: getZoneRiskScore(zone),
      status: 'active',
      insurance_active: true,
      subscription_start: new Date(),
      phone: phone || '',
      lat: lat || null,
      lng: lng || null,
      verified: false,
    });

    res.status(201).json({
      success: true,
      data: newWorker,
      pricing: { legacy: legacyPricing, dynamic: mlPricing },
    });
  } catch (err) {
    console.error('createWorker error:', err);
    res.status(500).json({ success: false, error: 'Failed to create worker' });
  }
};

// ── PATCH /api/workers/:id/verify ─────────────────────────────────
export const verifyWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.id });
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
    worker.verified = true;
    worker.status = 'active';
    worker.trust_level = 'trusted';
    await worker.save();
    res.json({ success: true, data: worker, message: `${worker.name} verified successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to verify worker' });
  }
};

// ── PATCH /api/workers/:id/status ─────────────────────────────────
export const updateWorkerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const worker = await Worker.findOne({ workerId: req.params.id });
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
    if (!['active', 'flagged', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    worker.status = status;
    if (status === 'flagged') worker.trust_level = 'flagged';
    await worker.save();
    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

// ── GET /api/workers/:id/pricing ──────────────────────────────────
export const getWorkerPricing = async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.id }).lean();
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });

    const legacyPricing = calculatePremium({
      plan: worker.plan, zone: worker.zone, city: worker.city,
      platform: worker.platform, earnings: worker.earnings, bcs: worker.bcs,
    });
    const mlPricing = calculateDynamicPremium({
      zone: worker.zone,
      trustScore: worker.trust_score || 75,
      activityLevel: Math.round(worker.earnings / 800),
    });

    res.json({
      success: true,
      data: { worker, pricing: { legacy: legacyPricing, dynamic: mlPricing } },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get pricing' });
  }
};

// ── DELETE /api/workers/:id ───────────────────────────────────────
export const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findOneAndDelete({ workerId: req.params.id });
    if (!worker) return res.status(404).json({ success: false, error: 'Worker not found' });
    res.json({ success: true, message: `${worker.name} removed`, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete worker' });
  }
};
