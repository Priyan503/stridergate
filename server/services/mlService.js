// ── ML/AI Service (Simulated Gemini Fallback) ───────────────────────────
// This service simulates intelligent responses from an LLM. 
// It analyzes raw telemetry data for fraud patterns and generates
// predictive analytics on weather risk over the upcoming week.

export const analyzeFraud = async (workerData) => {
  // Simulate network/AI processing delay
  await new Promise(r => setTimeout(r, 1500));

  const { bcs } = workerData;
  let verdict, action, color;
  let layers = [];

  // Generate plausible LLM reasoning dynamically based on the BCS score
  if (bcs >= 70) {
    verdict = 'Plausible Claim (AI Auto-Approve)';
    color   = 'var(--safe)';
    action  = 'Instigate UPI Payout immediately. Pattern matches natural human delivery.';
    layers = [
      { name: 'GPS Telemetry Intelligence', score: 92, pass: true, detail: 'AI confirmed natural road-speed motion (15–40 km/h). No spoofing apps detected in environment.' },
      { name: 'Weather API Cross-Match',    score: 89, pass: true, detail: 'Radar overlay corroborates local downpour in worker vicinity.' },
      { name: 'Sensor & Gyroscope',         score: 85, pass: true, detail: 'Micro-vibrations match two-wheeler idling/sheltering.' },
      { name: 'Cluster & Ring Fraud',       score: 98, pass: true, detail: 'No concurrent anomalies from similar locations.' }
    ];
  } else if (bcs >= 40) {
    verdict = 'Suspicious Pattern Alert (Soft-Review)';
    color   = 'var(--warn)';
    action  = 'Held for secondary cross-validation. Release if movement challenge is met.';
    layers = [
      { name: 'GPS Telemetry Intelligence', score: 55, pass: true, detail: 'Slight inconsistencies in trajectory smoothing. Possible network lag, but flagged for review.' },
      { name: 'Weather API Cross-Match',    score: 45, pass: false, detail: 'Worker reported heavy rain, but API shows only light drizzle clearing up.' },
      { name: 'Sensor & Gyroscope',         score: 70, pass: true, detail: 'Device motion matches activity profile.' },
      { name: 'Cluster & Ring Fraud',       score: 80, pass: true, detail: 'Clear record. No prior clustered attacks.' }
    ];
  } else {
    verdict = 'High Confidence Fraud (GPS Spoofing)';
    color   = 'var(--danger)';
    action  = 'Reject Claim and Flag Policy. Prompt challenge-response.';
    layers = [
      { name: 'GPS Telemetry Intelligence', score: 10, pass: false, detail: 'CRITICAL: Coordinates jump unnaturally. Perfect grid movement heavily indicates GPS Mock Location App usage.' },
      { name: 'Weather API Cross-Match',    score: 20, pass: false, detail: 'No precipitation recorded in a 5km radius. Totally false claim.' },
      { name: 'Sensor & Gyroscope',         score: 15, pass: false, detail: 'Device sits perfectly flat. Zero micro-tremors (accelerometer dormant).' },
      { name: 'Cluster & Ring Fraud',       score: 12, pass: false, detail: '3 identical claims filed within exactly 23 meters of each other in last 10 mins.' }
    ];
  }

  // Final LLM-like payload
  return {
    worker: workerData,
    layers,
    verdict: { text: verdict, color, action },
    confidence: bcs >= 70 ? 0.94 : (bcs >= 40 ? 0.65 : 0.99)
  };
};

export const generatePredictiveForecast = async () => {
  // Simulate AI generating insights for the administrative dashboard
  await new Promise(r => setTimeout(r, 1200));

  return {
    aiInsight: "Based on approaching monsoon patterns transitioning over the Western Ghats, expected rainfall will trigger claims primarily in the Bengaluru/MUM zones by mid-day Thursday. Loss Ratio is forecast to comfortably remain under 40% due to recent dynamic premium adjustments.",
    projectedClaims: 142,
    forecastLossRatio: "38%",
    highRiskZones: ['Koramangala, BLR (Risk: 87%)', 'Andheri East, MUM (Risk: 81%)'],
    timestamp: new Date().toISOString()
  };
};
