/**
 * BCS Engine — Behavioral Consistency Score (Enhanced with Anti-Spoofing)
 * 5-layer analysis:
 *   L1: Movement Intelligence (GPS + accelerometer)
 *   L2: Environmental Cross-Match (weather vs. claim)
 *   L3: Sensor & Behavioral Profile
 *   L4: Fraud Ring Detection
 *   L5: Anti-Spoofing (NEW — GPS drift + device consistency)
 */

// ── Anti-spoofing check: GPS drift analysis ───────────────────────
function detectGPSSpoofing(bcs) {
  // In a real system this would analyze GPS sample jitter, altitude consistency,
  // speed transitions. For demo we simulate based on BCS score pattern.
  const spoofScore = bcs < 40 ? Math.floor(Math.random() * 30) + 10
                    : bcs < 60 ? Math.floor(Math.random() * 20) + 60
                    : Math.floor(Math.random() * 15) + 80;

  return {
    name:    'Anti-Spoofing (GPS Drift)',
    score:   spoofScore,
    pass:    spoofScore >= 60,
    detail:  spoofScore >= 80 ? 'Natural GPS drift — consistent with road movement'
           : spoofScore >= 60 ? 'Minor GPS anomaly — within acceptable range'
           : spoofScore >= 40 ? 'GPS path looks synthetic — emulator patterns detected'
           :                    'GPS spoofing likely — location values are implausibly smooth',
    flag:    spoofScore < 40 ? 'SPOOF_DETECTED' : null,
  };
}

// ── Challenge-Response verification simulation ────────────────────
export function simulateChallengeResponse(bcs) {
  // Workers below BCS 60 are prompted to move 100m; result simulated here
  return {
    challenged:     bcs < 60,
    movementVerified: bcs >= 40,
    method:         'Accelerometer + GPS update',
    message:        bcs >= 60 ? 'No challenge required — movement pattern clean'
                  : bcs >= 40 ? 'Worker completed 100m movement challenge ✓'
                  :             'Worker did not respond to movement challenge ✗',
  };
}

/**
 * Run full 5-layer BCS analysis
 * @param {number} bcs - Worker's current BCS score
 * @returns {{ layers, verdict, finalScore, antiSpoofing, challengeResponse }}
 */
export function analyzeBCS(bcs) {
  const spoof = detectGPSSpoofing(bcs);

  const layers = [
    {
      name:   'Movement Intelligence',
      score:  bcs > 60 ? Math.min(bcs + 8, 98) : Math.max(bcs - 10, 0),
      pass:   bcs > 60,
      detail: bcs > 60
        ? 'Natural road-speed motion detected (15–40 km/h)'
        : 'Static device — no movement pattern recorded',
    },
    {
      name:   'Environmental Cross-Match',
      score:  bcs > 60 ? Math.min(bcs + 5, 97) : Math.max(bcs - 8, 0),
      pass:   bcs > 60,
      detail: bcs > 60
        ? 'Rain intensity from OpenWeatherMap matches halt threshold'
        : 'Traffic API shows clear roads — contradicts disruption claim',
    },
    {
      name:   'Sensor & Behavioral Profile',
      score:  bcs > 60 ? Math.max(bcs - 3, 0) : Math.max(bcs - 12, 0),
      pass:   bcs > 60,
      detail: bcs > 60
        ? 'Accelerometer consistent with sheltering under rain'
        : 'Flat sensor data — no real movement or vibration detected',
    },
    {
      name:   'Fraud Ring Detection',
      score:  bcs > 60 ? Math.min(bcs + 2, 96) : Math.max(bcs - 5, 0),
      pass:   bcs > 40,
      detail: bcs > 60 ? 'No coordinated cluster spike detected'
            : bcs > 40 ? 'Mild cluster pattern — monitoring'
            :             '3 claims from same device cluster in 2-hour window',
    },
    {
      name:   spoof.name,
      score:  spoof.score,
      pass:   spoof.pass,
      detail: spoof.detail,
      flag:   spoof.flag,
    },
  ];

  // ── Verdict ───────────────────────────────────────────────────
  let verdict;
  const allLayersPass = layers.every(l => l.pass);
  const spoofDetected = layers.some(l => l.flag === 'SPOOF_DETECTED');

  if (spoofDetected) {
    verdict = {
      text:   'GPS Spoofing Detected',
      color:  'danger',
      action: 'Claim rejected. Worker notified: "Unusual device activity detected — please reconnect and resubmit."',
    };
  } else if (bcs >= 70 && allLayersPass) {
    verdict = {
      text:   'Auto-Approved',
      color:  'safe',
      action: 'Payout within 5 minutes via UPI',
    };
  } else if (bcs >= 40) {
    verdict = {
      text:   'Soft Review',
      color:  'warn',
      action: 'Passive checks running — payout within 2 hours if verified',
    };
  } else {
    verdict = {
      text:   'Claim Held',
      color:  'danger',
      action: 'Location confirmation requested. Challenge-response verification initiated.',
    };
  }

  return {
    layers,
    verdict,
    finalScore:        bcs,
    antiSpoofing:      spoof,
    challengeResponse: simulateChallengeResponse(bcs),
    analysisTime:      new Date().toISOString(),
  };
}

/**
 * Determine claim status based on BCS score
 */
export function getClaimStatus(bcs) {
  if (bcs >= 70) return 'paid';
  if (bcs >= 40) return 'flagged';
  return 'rejected';
}
