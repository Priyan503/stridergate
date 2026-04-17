/**
 * Payout Rules — Trigger-based payout percentages.
 * From guide §8: determines what % of weekly premium is paid out per trigger type.
 */

export const PAYOUT_RULES = {
  heavy_rain:   { payout_percent: 0.30, label: 'Heavy rain (15mm+/hr)',             base_amount: 200 },
  extreme_rain: { payout_percent: 0.60, label: 'Extreme rain (50mm+/hr)',           base_amount: 400 },
  flood_risk:   { payout_percent: 0.80, label: 'Flood risk (75mm+ over 3hr)',       base_amount: 600 },
  high_aqi:     { payout_percent: 0.25, label: 'Poor air quality (AQI 200+)',       base_amount: 150 },
  severe_aqi:   { payout_percent: 0.50, label: 'Hazardous air quality (AQI 300+)',  base_amount: 350 },
  rain:         { payout_percent: 0.30, label: 'Rain disruption',                   base_amount: 200 },
  flood:        { payout_percent: 0.80, label: 'Flood',                             base_amount: 500 },
  pollution:    { payout_percent: 0.25, label: 'Air pollution',                     base_amount: 150 },
  accident:     { payout_percent: 1.00, label: 'Accident',                          base_amount: 1000 },
  curfew:       { payout_percent: 0.50, label: 'Curfew / restriction',              base_amount: 300 },
};

/**
 * Calculate the payout amount for a claim.
 * Uses either: estimated_loss from ML model, or base_amount from payout rules.
 *
 * @param {{ claim_type, estimated_loss, premium_amount }} params
 * @returns {{ amount, method, rule }}
 */
export function calculatePayoutAmount({ claim_type, estimated_loss, premium_amount }) {
  const rule = PAYOUT_RULES[claim_type] || PAYOUT_RULES.rain;

  // If ML estimated loss is available, use it (capped at 3x premium)
  if (estimated_loss && estimated_loss > 0 && premium_amount) {
    const maxPayout = premium_amount * 3;
    const mlPayout = Math.min(Math.round(estimated_loss * rule.payout_percent), maxPayout);
    return {
      amount: Math.max(mlPayout, rule.base_amount),
      method: 'ml_estimated',
      rule: rule.label,
    };
  }

  // Fallback: use base amount from rules
  return {
    amount: rule.base_amount,
    method: 'rule_based',
    rule: rule.label,
  };
}

/**
 * Evaluate payout for a specific trigger name + worker.
 * Used by the trigger controller when auto-creating claims.
 */
export function evaluatePayoutForTrigger(triggerName, worker) {
  const triggerMap = {
    'Heavy Rain':       'heavy_rain',
    'Extreme Heat':     'extreme_rain',
    'Severe AQI':       'severe_aqi',
    'Local Curfew':     'curfew',
    'Platform Outage':  'curfew',
  };
  const claimType = triggerMap[triggerName] || 'rain';
  return calculatePayoutAmount({
    claim_type: claimType,
    estimated_loss: 0,
    premium_amount: worker.premium_amount || worker.premium || 70,
  });
}
