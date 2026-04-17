/**
 * Dashboard Routes — Admin dashboard API endpoints.
 * Provides aggregated stats, claim management, and ML insights.
 */

import { Router } from 'express';
import Claim from '../models/Claim.js';
import Worker from '../models/Worker.js';
import { getStats } from '../controllers/adminController.js';

const router = Router();

// ── GET /api/dashboard/stats — aggregate dashboard stats ──────────
router.get('/stats', getStats);

// ── GET /api/dashboard/claims — paginated claims with ML scores ───
router.get('/claims', async (req, res) => {
  try {
    const { status, limit = 20, page = 1, sort = '-createdAt' } = req.query;
    const filter = status ? { status } : {};

    const claims = await Claim.find(filter)
      .sort(sort)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Claim.countDocuments(filter);

    res.json({
      success: true,
      data: claims,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
});

// ── GET /api/dashboard/claims/:claimId — single claim detail ──────
router.get('/claims/:claimId', async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.claimId }).lean();
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    // Also fetch worker info
    const worker = claim.workerId
      ? await Worker.findOne({ workerId: claim.workerId }).lean()
      : null;

    res.json({ success: true, data: { claim, worker } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch claim' });
  }
});

// ── POST /api/dashboard/claims/:claimId/decide — manual decision ──
router.post('/claims/:claimId/decide', async (req, res) => {
  try {
    const { decision, reviewer_note } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Invalid decision. Use approve or reject.' });
    }

    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    claim.status = decision === 'approve' ? 'paid' : 'rejected';
    claim.final_decision = decision;
    claim.decision_reason = reviewer_note || `Manually ${decision}d by admin`;
    claim.adminNote = reviewer_note || `Manually ${decision}d by admin`;
    await claim.save();

    // Update worker stats if approved
    if (decision === 'approve' && claim.workerId) {
      await Worker.updateOne(
        { workerId: claim.workerId },
        { $inc: { approved_claims: 1 } }
      );
    }

    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to process decision' });
  }
});

// ── GET /api/dashboard/workers — workers with ML scores ───────────
router.get('/workers', async (req, res) => {
  try {
    const { status, trust_level } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (trust_level) filter.trust_level = trust_level;

    const workers = await Worker.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch workers' });
  }
});

export default router;
