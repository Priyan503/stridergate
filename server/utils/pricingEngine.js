/**
 * Pricing Engine — Dynamic Premium Calculation
 * Adjusts weekly premium based on plan, zone risk, and season
 */

const PREMIUM_MAP = { Basic: 39, Standard: 59, Max: 89 };
const PAYOUT_MAP  = { Basic: 900, Standard: 1400, Max: 2200 };
const COVERAGE_MAP = { Basic: 30, Standard: 40, Max: 55 };

// High-risk zones get additional premium
const HIGH_RISK_ZONES = ['koramangala', 'hsr', 'andheri east', 'banjara hills'];

/**
 * Calculate dynamic premium for a worker
 * @param {{ plan: string, zone: string }} params
 * @returns {{ premium: number, maxPayout: number, coveragePercent: number, risk: string }}
 */
export function calculatePremium({ plan, zone }) {
  let base = PREMIUM_MAP[plan] || 59;

  // Zone risk surcharge
  const zoneLower = (zone || '').toLowerCase();
  if (HIGH_RISK_ZONES.some(z => zoneLower.includes(z))) {
    base += 15;
  }

  // Monsoon surcharge (June–September)
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) {
    base += 15;
  }

  const risk = base > 70 ? 'High' : 'Medium';

  return {
    premium: base,
    maxPayout: PAYOUT_MAP[plan] || 1400,
    coveragePercent: COVERAGE_MAP[plan] || 40,
    risk,
  };
}
