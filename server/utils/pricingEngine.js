/**
 * Pricing Engine — Dynamic Premium Calculation (ISS Model)
 * Based on Income Stability Score as described in README
 *
 * ISS = (Avg Orders × Consistency × Rating × Active Hours × Risk Factor)
 * High ISS → Lower premium | Low ISS → Higher premium
 */

const PLAN_BASE = { Basic: 39, Standard: 59, Max: 89 };
const PAYOUT_MAP   = { Basic: 900,  Standard: 1400, Max: 2200 };
const COVERAGE_MAP = { Basic: 30,   Standard: 40,   Max: 55   };

// ── Zone flood-risk surcharge ─────────────────────────────────────
const HIGH_RISK_ZONES   = ['koramangala', 'hsr', 'andheri east', 'banjara hills', 'dharavi', 'sion'];
const MEDIUM_RISK_ZONES = ['anna nagar', 'whitefield', 'electronic city'];

// ── Platform risk factor (based on historical disruption data) ────
const PLATFORM_RISK = {
  Swiggy:       1.0,
  Zomato:       1.0,
  Blinkit:      1.1,  // 10% higher — operates through more rain
  Zepto:        1.1,
  'Amazon Flex':0.95, // Slightly lower — more indoor deliveries
};

/**
 * Calculate Income Stability Score (ISS)
 * @param {{ avgOrders, consistency, rating, activeHours }} params
 * Returns 0–100
 */
export function calculateISS({ avgOrders = 20, consistency = 0.7, rating = 4.0, activeHours = 8 }) {
  // Normalize each factor to 0–1 scale
  const orderScore      = Math.min(avgOrders / 30, 1);          // 30 = excellent
  const consistencyScore= Math.min(consistency, 1);              // already 0–1
  const ratingScore     = Math.min((rating - 3) / 2, 1);        // 3–5 range → 0–1
  const hoursScore      = Math.min(activeHours / 10, 1);         // 10h = max

  const rawISS = (orderScore + consistencyScore + ratingScore + hoursScore) / 4 * 100;
  return Math.round(Math.max(0, Math.min(100, rawISS)));
}

/**
 * Calculate dynamic premium for a worker
 * @param {{ plan, zone, city, platform, earnings, bcs }} params
 */
export function calculatePremium({ plan, zone, city, platform, earnings, bcs }) {
  let base = PLAN_BASE[plan] || 59;

  // 1. Zone flood-risk surcharge
  const zoneLower = (zone || '').toLowerCase();
  if      (HIGH_RISK_ZONES.some(z   => zoneLower.includes(z))) base += 15;
  else if (MEDIUM_RISK_ZONES.some(z => zoneLower.includes(z))) base += 8;

  // 2. Monsoon surcharge (June–September)
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) base += 15;

  // 3. Platform risk multiplier
  const platformMult = PLATFORM_RISK[platform] || 1.0;
  base = Math.round(base * platformMult);

  // 4. BCS-based discount/surcharge
  // High BCS (trustworthy worker) → lower premium
  // Low BCS (fraud risk)          → higher premium
  if (bcs) {
    if      (bcs >= 85) base = Math.round(base * 0.90); // 10% discount
    else if (bcs >= 70) base = Math.round(base * 0.95); // 5% discount
    else if (bcs <  40) base = Math.round(base * 1.20); // 20% surcharge
    else if (bcs <  55) base = Math.round(base * 1.10); // 10% surcharge
  }

  // 5. Earnings-proportional adjustment
  // Workers earning more pay slightly higher premium (higher coverage need)
  if (earnings) {
    if      (earnings > 6000) base = Math.round(base * 1.05);
    else if (earnings < 2000) base = Math.round(base * 0.95);
  }

  const riskLevel = base > 95 ? 'Very High' : base > 75 ? 'High' : base > 59 ? 'Medium' : 'Low';

  // ISS Calculation using available data
  const iss = calculateISS({
    avgOrders:    earnings ? Math.round(earnings / 150) : 20,
    consistency:  bcs      ? bcs / 100                 : 0.7,
    rating:       4.2,       // assumed average
    activeHours:  8,
  });

  return {
    premium:         base,
    maxPayout:       PAYOUT_MAP[plan]   || 1400,
    coveragePercent: COVERAGE_MAP[plan] || 40,
    riskLevel,
    iss,
    breakdown: {
      basePremium:      PLAN_BASE[plan] || 59,
      zoneRiskSurcharge: zoneLower && HIGH_RISK_ZONES.some(z => zoneLower.includes(z)) ? 15 : 0,
      monsoonSurcharge:  (month >= 5 && month <= 8) ? 15 : 0,
      bcsAdjustment:     bcs ? (bcs >= 70 ? 'Discount applied' : 'Surcharge applied') : 'None',
      finalPremium:      base,
    }
  };
}
