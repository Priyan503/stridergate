/**
 * Dynamic Pricing Service — calculates weekly premium based on zone risk,
 * trust score, and activity level.
 *
 * From guide §10: BASE_PREMIUM ₹49, MAX_PREMIUM ₹149
 */

const ZONE_RISK_SCORES = {
  'koramangala':      0.75,
  'hsr layout':       0.70,
  'andheri east':     0.80,
  'anna nagar':       0.40,
  'banjara hills':    0.55,
  'connaught place':  0.60,
  'whitefield':       0.50,
  'electronic city':  0.45,
  'dharavi':          0.85,
  'sion':             0.75,
};

const BASE_PREMIUM = 49;   // INR per week (minimum)
const MAX_PREMIUM = 149;   // INR per week (maximum)

/**
 * Calculate dynamic premium for a worker.
 * @param {{ zone, trustScore, activityLevel, city }} params
 * @returns {{ premium_inr, zone_risk_score, trust_discount_applied, breakdown }}
 */
export function calculateDynamicPremium({ zone, trustScore = 75, activityLevel = 5, city }) {
  const zoneLower = (zone || '').toLowerCase();
  const zoneRisk = ZONE_RISK_SCORES[zoneLower] || 0.5;

  // Higher trust score = lower premium (reward reliable workers)
  const trustDiscount = (trustScore / 100) * 0.2;

  // Higher activity = higher exposure = slightly higher premium
  const activityMultiplier = 1 + (activityLevel / 10) * 0.15;

  const rawPremium = BASE_PREMIUM * (1 + zoneRisk) * activityMultiplier * (1 - trustDiscount);
  const premium = Math.min(MAX_PREMIUM, Math.max(BASE_PREMIUM, Math.round(rawPremium)));

  return {
    premium_inr: premium,
    zone_risk_score: zoneRisk,
    trust_discount_applied: trustDiscount,
    breakdown: {
      base: BASE_PREMIUM,
      zone_multiplier: zoneRisk,
      activity_multiplier: activityMultiplier,
      trust_discount: trustDiscount,
      final: premium,
    },
  };
}

export function getZoneRiskScore(zone) {
  return ZONE_RISK_SCORES[(zone || '').toLowerCase()] || 0.5;
}
