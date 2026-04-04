// ── Admin Stats Controller ───────────────────────────────────
// Aggregates data for the admin dashboard

// In-memory references (same data as other controllers)
const WORKERS_COUNT = 4;
const WEEKLY_DATA = [62, 48, 85, 91, 73, 67, 88];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RISK_FORECAST = [
  { zone: 'Koramangala, BLR', risk: 87, label: 'High' },
  { zone: 'Andheri East, MUM', risk: 72, label: 'High' },
  { zone: 'Anna Nagar, CHN', risk: 38, label: 'Low' },
  { zone: 'Banjara Hills, HYD', risk: 54, label: 'Medium' },
];

// GET /api/admin/stats
export const getStats = (req, res) => {
  res.json({
    success: true,
    data: {
      activePolicies: WORKERS_COUNT,
      claimsProcessed: 3,
      flaggedClaims: 1,
      totalPayout: 670,
      lossRatio: '34%',
      weeklyData: WEEKLY_DATA,
      days: DAYS,
      riskForecast: RISK_FORECAST,
    },
  });
};
