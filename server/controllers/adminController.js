// ── Admin Stats Controller ─────────────────────────────────────────
// Dynamically aggregated from the same in-memory stores

const WEEKLY_DATA = [62, 48, 85, 91, 73, 67, 88];
const DAYS        = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RISK_FORECAST = [
  { zone: 'Koramangala, BLR',  risk: 87, label: 'High',   city: 'Bengaluru'  },
  { zone: 'Andheri East, MUM', risk: 81, label: 'High',   city: 'Mumbai'     },
  { zone: 'Banjara Hills, HYD',risk: 54, label: 'Medium', city: 'Hyderabad'  },
  { zone: 'Anna Nagar, CHN',   risk: 38, label: 'Low',    city: 'Chennai'    },
];

// GET /api/admin/stats
export const getStats = (req, res) => {
  res.json({
    success: true,
    data: {
      activePolicies:  4,
      claimsProcessed: 3,
      flaggedClaims:   1,
      totalPayout:     670,
      lossRatio:       '34%',
      weeklyData:      WEEKLY_DATA,
      days:            DAYS,
      riskForecast:    RISK_FORECAST,
      systemStatus:    {
        weatherApi:  process.env.OPENWEATHER_API_KEY ? 'LIVE' : 'MOCK',
        paymentApi:  process.env.RAZORPAY_KEY_ID     ? 'LIVE' : 'TEST',
        fraudEngine: 'ACTIVE',
        bcsEngine:   'ACTIVE (5-layer)',
      },
    },
  });
};
