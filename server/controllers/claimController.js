/**
 * Claim Controller — ML-powered claim processing with MongoDB.
 * Full pipeline: weather snapshot → ML scoring → rule engine → LLM → payout
 */

import Claim from '../models/Claim.js';
import Worker from '../models/Worker.js';
import RiderActivity from '../models/RiderActivity.js';
import OrderEvent from '../models/OrderEvent.js';
import SensorData from '../models/SensorData.js';
import { runFraudCheck, resolveEscalation } from '../services/mlClient.js';
import { getWeatherAtLocation, evaluateTriggers } from '../services/weatherService.js';
import { calculatePayoutAmount } from '../config/payoutRules.js';
import { initiateClaimPayout } from '../services/paymentService.js';
import { v4 as uuidv4 } from 'uuid';

// ── GET /api/claims — all claims ──────────────────────────────────
export const getClaims = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = status ? { status } : {};

    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Claim.countDocuments(filter);
    res.json({ success: true, data: claims, total, page: parseInt(page) });
  } catch (err) {
    console.error('getClaims error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
};

// ── GET /api/claims/worker/:workerId ──────────────────────────────
export const getWorkerClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ workerId: req.params.workerId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch worker claims' });
  }
};

// ── GET /api/claims/:id ───────────────────────────────────────────
export const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id }).lean();
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch claim' });
  }
};

// ── POST /api/claims — Submit a new claim (ML-powered) ────────────
export const createClaim = async (req, res) => {
  try {
    const { worker, workerId, zone, trigger, amount, bcs, claim_type, reported_issue, gps_lat, gps_lng } = req.body;

    if (!worker || !zone || !trigger) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Fetch worker from DB
    const workerDoc = workerId
      ? await Worker.findOne({ workerId }).lean()
      : null;

    const now = new Date();
    const riderId = workerId || 'unknown';
    const claimGpsLat = gps_lat || workerDoc?.lat || 12.97;
    const claimGpsLng = gps_lng || workerDoc?.lng || 77.59;

    // ── Step 1: Capture environmental snapshots ────────────────────
    const weatherSnapshot = await getWeatherAtLocation(claimGpsLat, claimGpsLng);
    const triggerResult = evaluateTriggers(weatherSnapshot);

    // ── Step 2: Fetch rider's recent activity from MongoDB ────────
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [activityWindow, orderWindow, sensorWindow] = await Promise.all([
      RiderActivity.find({ rider_id: riderId, timestamp: { $gte: twoHoursAgo } })
        .sort({ timestamp: -1 }).limit(200).lean(),
      OrderEvent.find({ rider_id: riderId, pickup_time: { $gte: sevenDaysAgo } })
        .sort({ pickup_time: -1 }).limit(100).lean(),
      SensorData.find({ rider_id: riderId, timestamp: { $gte: twoHoursAgo } })
        .sort({ timestamp: -1 }).limit(200).lean(),
    ]);

    // ── Step 3: Run ML + LLM fraud check ──────────────────────────
    const claimType = claim_type || trigger.toLowerCase().replace(/\s+/g, '_');
    const mlDecision = await runFraudCheck({
      rider_id: riderId,
      claim_data: {
        claim_type: claimType,
        reported_issue: reported_issue || trigger,
        gps_lat: claimGpsLat,
        gps_lng: claimGpsLng,
      },
      activity_window: activityWindow,
      order_window: orderWindow,
      sensor_window: sensorWindow,
      weather_snapshot: {
        ...weatherSnapshot,
        rain: { '1h': weatherSnapshot.rainfall || 0 },
        wind: { speed: weatherSnapshot.wind || 0 },
        aqi: weatherSnapshot.aqi || 0,
      },
      traffic_snapshot: {},
      zone_risk_score: workerDoc?.risk_zone_score || 0.5,
    });

    const escalation = resolveEscalation(mlDecision);

    // ── Step 4: Calculate payout ──────────────────────────────────
    const payout = calculatePayoutAmount({
      claim_type: claimType,
      estimated_loss: mlDecision.scores?.estimated_earnings || 0,
      premium_amount: workerDoc?.premium_amount || workerDoc?.premium || 59,
    });

    const payoutAmount = amount ? Number(amount) : payout.amount;

    // ── Step 5: Determine final status ────────────────────────────
    let finalStatus;
    if (escalation.action === 'approve' || escalation.action === 'auto_approve') {
      finalStatus = 'paid';
    } else if (escalation.action === 'reject') {
      finalStatus = 'rejected';
    } else if (escalation.action === 'manual_review') {
      finalStatus = 'flagged';
    } else {
      finalStatus = 'pending';
    }

    // ── Step 6: Save claim to MongoDB ─────────────────────────────
    const newClaim = await Claim.create({
      claimId: `CLM-${uuidv4().slice(0, 8).toUpperCase()}`,
      worker,
      workerId: riderId,
      zone,
      trigger,
      claim_type: claimType,
      claim_time: now,
      reported_issue: reported_issue || trigger,

      // Environmental data
      weather_snapshot: {
        condition: weatherSnapshot.desc || weatherSnapshot.condition,
        rainfall_mm: weatherSnapshot.rainfall || 0,
        wind_speed: weatherSnapshot.wind || 0,
        aqi: weatherSnapshot.aqi || 0,
        temperature: weatherSnapshot.temp,
        data_source: weatherSnapshot.live ? 'openweather' : 'mock',
      },
      gps_at_claim: { lat: claimGpsLat, lng: claimGpsLng },

      // ML scores
      risk_score: mlDecision.scores?.risk_score,
      anomaly_score: mlDecision.scores?.anomaly_score,
      estimated_loss: mlDecision.scores?.estimated_earnings,
      spoofing_score_at_claim: workerDoc?.spoofing_score || 0,

      // Full ML analysis pipeline
      ml_analysis: {
        risk_model: {
          score: mlDecision.scores?.risk_score || 0,
          features_used: (mlDecision.top_features || []).slice(0, 5),
          status: mlDecision.scores?.risk_score != null ? 'completed' : 'unavailable',
        },
        fraud_model: {
          anomaly_score: mlDecision.scores?.anomaly_score || 0,
          top_signals: mlDecision.llm_decision?.top_flags || [],
          status: mlDecision.scores?.anomaly_score != null ? 'completed' : 'unavailable',
        },
        weather_check: {
          mismatch: mlDecision.weather_mismatch || false,
          actual_conditions: weatherSnapshot.desc || weatherSnapshot.condition || 'Unknown',
          status: 'completed',
        },
        rule_engine: {
          decision: mlDecision.rule_decision?.decision || escalation.action,
          reason: mlDecision.rule_decision?.reason || escalation.reason,
        },
        llm_reasoning: {
          decision: mlDecision.llm_decision?.decision_support || 'skip',
          reason: mlDecision.llm_decision?.reason || '',
          confidence: mlDecision.llm_decision?.confidence || 0,
          top_flags: mlDecision.llm_decision?.top_flags || [],
          llm_used: mlDecision.llm_decision?.llm_used || false,
        },
        feature_vector: mlDecision.top_features || [],
        independent_signal_count: mlDecision.independent_signal_count || 0,
        weather_mismatch: mlDecision.weather_mismatch || false,
      },

      // Decisions
      status: finalStatus,
      final_decision: escalation.action,
      decision_reason: escalation.reason,
      llm_decision: mlDecision.llm_decision?.decision_support,
      llm_reason: mlDecision.llm_decision?.reason,
      llm_confidence: mlDecision.llm_decision?.confidence,
      llm_top_flags: mlDecision.llm_decision?.top_flags || [],

      // Payout
      amount: payoutAmount,
      triggers_fired: triggerResult.triggers_fired || [],

      // Legacy compatibility
      bcs: bcs || workerDoc?.bcs || 75,
      time: now.toTimeString().slice(0, 5),
      date: now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      adminNote: '',
    });

    // ── Step 7: Auto-payout if approved ───────────────────────────
    if (finalStatus === 'paid') {
      try {
        const txn = await initiateClaimPayout({
          workerId: riderId,
          amount: payoutAmount,
          claimId: newClaim.claimId,
        });
        newClaim.payout_transaction_id = txn.payoutId;
        await newClaim.save();
      } catch (payErr) {
        console.error('Payout error:', payErr.message);
      }

      // Update worker claim counts
      if (workerDoc) {
        await Worker.updateOne(
          { workerId: riderId },
          { $inc: { total_claims: 1, approved_claims: 1, claims: 1 } }
        );
      }
    } else if (workerDoc) {
      await Worker.updateOne(
        { workerId: riderId },
        { $inc: { total_claims: 1, claims: 1 } }
      );
    }

    // ── Response ──────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      data: newClaim,
      ml: {
        risk_score: mlDecision.scores?.risk_score,
        anomaly_score: mlDecision.scores?.anomaly_score,
        estimated_loss: mlDecision.scores?.estimated_earnings,
        decision: escalation.action,
        reason: escalation.reason,
        llm_used: mlDecision.llm_decision?.llm_used || false,
        llm_reason: mlDecision.llm_decision?.reason,
        triggers_fired: triggerResult.triggers_fired,
      },
    });
  } catch (err) {
    console.error('Claim submission error:', err);
    res.status(500).json({ success: false, error: 'Claim processing failed. Please try again.' });
  }
};

// ── POST /api/claims/:id/analyze — run BCS analysis (legacy) ──────
export const analyzeClaim = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id }).lean();
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    // Import legacy BCS engine for backward compatibility
    const { analyzeBCS } = await import('../utils/bcsEngine.js');
    const analysis = analyzeBCS(claim.bcs || 75);

    res.json({
      success: true,
      data: {
        claim,
        analysis,
        ml_scores: {
          risk_score: claim.risk_score,
          anomaly_score: claim.anomaly_score,
          estimated_loss: claim.estimated_loss,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
};

// ── PATCH /api/claims/:id/approve ─────────────────────────────────
export const approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id });
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    claim.status = 'paid';
    claim.final_decision = 'approve';
    claim.adminNote = req.body.note || 'Manually approved by admin';
    await claim.save();

    // Trigger payout
    try {
      const txn = await initiateClaimPayout({
        workerId: claim.workerId,
        amount: claim.amount,
        claimId: claim.claimId,
      });
      claim.payout_transaction_id = txn.payoutId;
      await claim.save();
    } catch (payErr) {
      console.error('Payout error on approve:', payErr.message);
    }

    if (claim.workerId) {
      await Worker.updateOne({ workerId: claim.workerId }, { $inc: { approved_claims: 1 } });
    }

    res.json({
      success: true,
      data: claim,
      message: `Claim ${claim.claimId} approved — payout ₹${claim.amount} initiated`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to approve claim' });
  }
};

// ── PATCH /api/claims/:id/reject ──────────────────────────────────
export const rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id });
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

    claim.status = 'rejected';
    claim.final_decision = 'reject';
    claim.adminNote = req.body.note || 'Rejected by admin';
    await claim.save();

    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reject claim' });
  }
};
