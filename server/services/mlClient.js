/**
 * ML Service Client — HTTP client to call the Python FastAPI ML service.
 * Handles the full fraud-check pipeline and escalation resolution.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Run full ML + LLM fraud check by calling the Python service.
 * @param {Object} claimPayload — shaped to match ClaimRequest in main.py
 * @returns {Object} — { rule_decision, llm_decision, scores, ... }
 */
export async function runFraudCheck(claimPayload) {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`${ML_SERVICE_URL}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimPayload),
      signal: AbortSignal.timeout(120000), // 120s timeout for local LLM (Ollama)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`ML service error (${res.status}):`, errText);
      return getFallbackDecision('ML service returned an error');
    }

    return await res.json();
  } catch (err) {
    console.error('ML service unavailable:', err.message);
    return getFallbackDecision(`ML service unreachable: ${err.message}`);
  }
}

/**
 * Resolve the final escalation decision by combining rule engine + LLM outputs.
 * @param {Object} mlDecision — from runFraudCheck()
 * @returns {{ action: string, delay_ms: number, reason: string }}
 */
export function resolveEscalation(mlDecision) {
  const { rule_decision, llm_decision, scores } = mlDecision;

  // If both rule engine and LLM agree on reject — hard reject
  if (rule_decision?.decision === 'reject' && llm_decision?.decision_support === 'reject') {
    return {
      action: 'reject',
      delay_ms: 0,
      reason: rule_decision.reason || 'Both rule engine and LLM recommend rejection.',
    };
  }

  // Manual review: delay payout, require verification
  if (rule_decision?.decision === 'manual_review' || llm_decision?.decision_support === 'manual_review') {
    return {
      action: 'manual_review',
      delay_ms: 24 * 60 * 60 * 1000, // 24h hold
      reason: rule_decision?.reason || 'Flagged for manual review.',
    };
  }

  // Verify: light check
  if (rule_decision?.decision === 'verify') {
    return {
      action: 'verify',
      delay_ms: 2 * 60 * 60 * 1000, // 2h hold
      reason: rule_decision?.reason || 'Light verification required.',
    };
  }

  // Auto approve
  return {
    action: 'approve',
    delay_ms: 0,
    reason: rule_decision?.reason || 'Approved — low risk.',
  };
}

/**
 * Quick ML scoring without LLM (faster, cheaper).
 */
export async function getMLScores(claimPayload) {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Check ML service health.
 */
export async function checkMLHealth() {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { status: 'error' };
    return await res.json();
  } catch {
    return { status: 'unreachable' };
  }
}

/**
 * Fallback decision when ML service is unavailable.
 */
function getFallbackDecision(errorMsg) {
  return {
    rule_decision: {
      decision: 'manual_review',
      reason: `ML service unavailable — defaulting to manual review. ${errorMsg}`,
    },
    llm_decision: {
      decision_support: 'manual_review',
      reason: 'LLM unavailable.',
      confidence: 0.0,
      top_flags: [],
      llm_used: false,
    },
    scores: {
      risk_score: 0.5,
      anomaly_score: 0.3,
      estimated_earnings: 0,
    },
    independent_signal_count: 0,
    weather_mismatch: false,
    top_features: [],
  };
}
