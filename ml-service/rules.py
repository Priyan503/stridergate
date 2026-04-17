"""
Rule Engine — Hard deterministic constraints applied before the LLM layer.
Makes the system legally auditable and deterministic for edge cases.
"""


def apply_rules(
    risk_score: float,
    fraud_score: float,
    anomaly_score: float,
    shock_event: bool,
    speed_at_event: float,
    weather_mismatch: bool,
    independent_signal_count: int,
) -> dict:
    """
    Returns a decision dict with action and reason.

    Parameters:
      risk_score              : float 0-1, from XGBoost
      fraud_score             : float (Isolation Forest decision_function; lower = more anomalous)
      anomaly_score           : float 0-1 (normalized fraud_score)
      shock_event             : bool, from sensor data
      speed_at_event          : float, GPS speed at claim time
      weather_mismatch        : bool, True if claimed weather != actual GPS zone weather
      independent_signal_count: int, number of independent fraud signals that agree
    """

    # Auto-approve: physical accident evidence (sensor + speed)
    if shock_event and speed_at_event > 40:
        return {
            "decision": "auto_approve",
            "reason": "Shock event detected at high speed — likely accident.",
        }

    # Hard reject: environmental mismatch is the strongest signal
    if weather_mismatch:
        return {
            "decision": "reject",
            "reason": "Claimed weather condition does not match GPS zone data.",
        }

    # Hard reject: very high fraud probability
    if anomaly_score > 0.85:
        return {
            "decision": "reject",
            "reason": "Anomaly score exceeds threshold — high fraud probability.",
        }

    # Flag for manual review: multiple signals agree (require at least 2)
    if independent_signal_count >= 2 and anomaly_score > 0.5:
        return {
            "decision": "manual_review",
            "reason": f"{independent_signal_count} independent fraud signals detected.",
        }

    # Flag for manual review: elevated risk + elevated anomaly
    if risk_score > 0.7 and anomaly_score > 0.4:
        return {
            "decision": "manual_review",
            "reason": "Elevated risk and anomaly scores — pending verification.",
        }

    # Low risk: approve
    if risk_score < 0.3 and anomaly_score < 0.2:
        return {
            "decision": "auto_approve",
            "reason": "Low risk and no anomaly signals detected.",
        }

    # Default: light verification
    return {
        "decision": "verify",
        "reason": "Borderline scores — light verification required.",
    }


def count_independent_signals(feature_vector: dict) -> int:
    """Count how many independent fraud signals are active."""
    signals = [
        feature_vector.get("gps_jump_count", 0) > 2,
        feature_vector.get("idle_time_ratio", 0) > 0.8,
        feature_vector.get("sensor_inactivity_ratio", 0) > 0.9,
        feature_vector.get("cancellation_rate", 0) > 0.7,
        feature_vector.get("weather_mismatch", False),
    ]
    return sum(signals)
