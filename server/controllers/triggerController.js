/**
 * Trigger Controller — MongoDB-backed with auto-claim generation.
 * When a trigger fires, it creates claims for all workers in affected zones.
 */

import Trigger from '../models/Trigger.js';
import Worker from '../models/Worker.js';
import Claim from '../models/Claim.js';
import { v4 as uuid } from 'uuid';
import { getWeatherByCity, evaluateTriggers } from '../services/weatherService.js';
import { evaluatePayoutForTrigger } from '../config/payoutRules.js';

// ── GET /api/triggers ─────────────────────────────────────────────
export const getTriggers = async (req, res) => {
  try {
    const triggers = await Trigger.find().sort({ triggerId: 1 }).lean();
    res.json({ success: true, data: triggers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch triggers' });
  }
};

// ── POST /api/triggers/:id/simulate — Fire a trigger & create claims
export const simulateTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findOne({ triggerId: req.params.id });
    if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });

    // Mark trigger as fired
    trigger.fired = true;
    trigger.firedAt = new Date();

    // Set realistic values when fired
    const triggerValues = {
      T1: { current: '41.8mm', claim_type: 'heavy_rain', condition: 'Heavy Rain' },
      T2: { current: '45.2°C', claim_type: 'extreme_heat', condition: 'Extreme Heat' },
      T3: { current: '423',    claim_type: 'pollution',    condition: 'Severe AQI' },
      T4: { current: 'Active', claim_type: 'curfew',       condition: 'Local Curfew' },
      T5: { current: 'Down',   claim_type: 'outage',       condition: 'Platform Outage' },
    };
    const tv = triggerValues[trigger.triggerId] || { current: 'Active', claim_type: 'disruption', condition: 'Disruption' };
    trigger.current = tv.current;
    await trigger.save();

    // Find all active, insured workers and create claims for them
    const workers = await Worker.find({ status: 'active', insurance_active: true }).lean();
    const claimsCreated = [];

    for (const w of workers) {
      // Check if worker already has a pending/paid claim for this trigger today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existing = await Claim.findOne({
        workerId: w.workerId,
        trigger: trigger.name,
        claim_time: { $gte: today },
      });
      if (existing) continue;

      // Calculate payout amount
      const payout = evaluatePayoutForTrigger(trigger.name, w);
      const claimId = `CLM-${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const claim = await Claim.create({
        claimId,
        worker: w.name,
        workerId: w.workerId,
        zone: w.zone,
        trigger: trigger.name,
        claim_type: tv.claim_type,
        weather_snapshot: {
          condition: tv.condition,
          rainfall_mm: trigger.triggerId === 'T1' ? 41.8 : 0,
          wind_speed: 12,
          aqi: trigger.triggerId === 'T3' ? 423 : 150,
          data_source: 'trigger_simulation',
        },
        risk_score: Math.random() * 0.3 + 0.1,
        anomaly_score: Math.random() * 0.15,
        estimated_loss: payout.amount * 1.4,
        amount: payout.amount,
        status: (w.trust_score || w.bcs) >= 70 ? 'paid' : 'pending',
        final_decision: (w.trust_score || w.bcs) >= 70 ? 'approve' : 'manual_review',
        llm_decision: 'skip',
        llm_reason: `Auto-generated from ${trigger.name} trigger simulation.`,
        bcs: w.bcs || w.trust_score || 50,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        claim_time: new Date(),
      });

      claimsCreated.push(claim);
    }

    res.json({
      success: true,
      data: trigger,
      claimsCreated: claimsCreated.length,
      message: `${trigger.name} fired! ${claimsCreated.length} auto-claims created for affected workers.`,
    });
  } catch (err) {
    console.error('simulateTrigger error:', err);
    res.status(500).json({ success: false, error: 'Failed to simulate trigger' });
  }
};

// ── POST /api/triggers/:id/reset ──────────────────────────────────
export const resetTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findOne({ triggerId: req.params.id });
    if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });

    // Reset the original value based on trigger type
    const defaults = { T1: '12.4mm', T2: '38.4°C', T3: '287', T4: 'Clear', T5: 'Operational' };
    trigger.fired = false;
    trigger.firedAt = null;
    trigger.current = defaults[trigger.triggerId] || '0';
    await trigger.save();

    res.json({ success: true, data: trigger });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset trigger' });
  }
};

// ── POST /api/triggers/check-weather — Live weather trigger check ──
export const checkWeatherTriggers = async (req, res) => {
  try {
    const { city, lat, lng } = req.body;
    let weatherData;

    if (lat && lng) {
      const { getWeatherAtLocation } = await import('../services/weatherService.js');
      weatherData = await getWeatherAtLocation(lat, lng);
    } else {
      weatherData = await getWeatherByCity(city || 'Bengaluru');
    }

    const triggerResult = evaluateTriggers(weatherData);
    res.json({ success: true, data: { weather: weatherData, triggers: triggerResult } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check triggers' });
  }
};
