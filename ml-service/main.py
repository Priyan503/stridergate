"""
FastAPI Prediction Service — Central ML microservice.
The Node.js backend calls this for every claim decision.

Endpoints:
  POST /predict   — Fast ML scoring (no LLM call)
  POST /decision  — Full pipeline: scoring → rules → LLM
  GET  /health    — Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

from features import (
    compute_gps_features,
    compute_behavioral_features,
    compute_sensor_features,
    compute_environmental_features,
    build_feature_vector,
)
from rules import apply_rules, count_independent_signals
from llm import get_llm_decision, LLM_ENABLED

app = FastAPI(title="Shielded Rider ML Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models at startup ────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

try:
    risk_model = joblib.load(os.path.join(MODELS_DIR, "risk.pkl"))
    print("  [OK] Risk model loaded (XGBoost)")
except Exception as e:
    print(f"  [WARN] Risk model not found: {e}")
    risk_model = None

try:
    earnings_model = joblib.load(os.path.join(MODELS_DIR, "earnings.pkl"))
    print("  [OK] Earnings model loaded (LightGBM)")
except Exception as e:
    print(f"  [WARN] Earnings model not found: {e}")
    earnings_model = None

try:
    fraud_model = joblib.load(os.path.join(MODELS_DIR, "fraud.pkl"))
    print("  [OK] Fraud model loaded (IsolationForest)")
except Exception as e:
    print(f"  [WARN] Fraud model not found: {e}")
    fraud_model = None

# ── Feature columns for each model ────────────────────────────────────
RISK_FEATURES = [
    "rain_intensity_mm", "aqi", "wind_speed", "traffic_congestion_ratio",
    "zone_risk_score", "hour_of_day", "day_of_week",
]

EARNINGS_FEATURES = [
    "avg_daily_orders", "zone_risk_score", "hour_of_day",
    "day_of_week", "rain_intensity_mm",
]

FRAUD_FEATURES = [
    "idle_time_ratio", "gps_jump_count", "cancellation_rate",
    "sensor_inactivity_ratio", "avg_speed", "shock_event_count",
]


# ── Request Schema ────────────────────────────────────────────────────
class ClaimRequest(BaseModel):
    rider_id: str
    claim_data: dict
    activity_window: List[dict]
    order_window: List[dict]
    sensor_window: List[dict]
    weather_snapshot: dict
    traffic_snapshot: Optional[dict] = {}
    zone_risk_score: Optional[float] = 0.5


# ── Helper: Build feature row for a specific model ────────────────────
def _get_feature_row(fv: dict, feature_cols: list) -> list:
    return [fv.get(col, 0) for col in feature_cols]


# ── POST /predict — Fast scoring ──────────────────────────────────────
@app.post("/predict")
def predict(req: ClaimRequest):
    """Fast scoring endpoint — returns scores only, no LLM call."""
    try:
        activity_df = pd.DataFrame(req.activity_window) if req.activity_window else pd.DataFrame()
        orders_df = pd.DataFrame(req.order_window) if req.order_window else pd.DataFrame()
        sensor_df = pd.DataFrame(req.sensor_window) if req.sensor_window else pd.DataFrame()

        gps_feats = compute_gps_features(activity_df)
        behavior_feats = compute_behavioral_features(orders_df)
        sensor_feats = compute_sensor_features(sensor_df)
        env_feats = compute_environmental_features(req.weather_snapshot, req.traffic_snapshot or {})

        fv = build_feature_vector(gps_feats, behavior_feats, sensor_feats, env_feats)

        # Add extra context features
        from datetime import datetime
        now = datetime.now()
        fv["zone_risk_score"] = req.zone_risk_score or 0.5
        fv["hour_of_day"] = now.hour
        fv["day_of_week"] = now.weekday()

        # Risk score
        risk_score = 0.5
        if risk_model is not None:
            risk_row = _get_feature_row(fv, RISK_FEATURES)
            risk_score = float(risk_model.predict_proba([risk_row])[0][1])

        # Earnings estimate
        estimated_earnings = 0.0
        if earnings_model is not None:
            earnings_row = _get_feature_row(fv, EARNINGS_FEATURES)
            estimated_earnings = float(earnings_model.predict([earnings_row])[0])

        # Fraud / anomaly score
        anomaly_score = 0.3
        if fraud_model is not None:
            fraud_row = _get_feature_row(fv, FRAUD_FEATURES)
            fraud_df = pd.DataFrame([fraud_row], columns=FRAUD_FEATURES)
            fraud_raw = float(fraud_model.decision_function(fraud_df)[0])
            anomaly_score = float(np.clip(1 - (fraud_raw + 0.5), 0, 1))

        return {
            "risk_score": round(risk_score, 4),
            "anomaly_score": round(anomaly_score, 4),
            "estimated_earnings": round(estimated_earnings, 2),
            "feature_vector": fv,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /decision — Full pipeline ────────────────────────────────────
@app.post("/decision")
def decision(req: ClaimRequest):
    """Full pipeline: scoring → rule engine → LLM reasoning."""
    scores_resp = predict(req)

    risk_score = scores_resp["risk_score"]
    anomaly_score = scores_resp["anomaly_score"]
    estimated_earnings = scores_resp["estimated_earnings"]
    fv = scores_resp["feature_vector"]

    # Detect weather mismatch
    claimed_rain = req.claim_data.get("claim_type") in ["rain", "flood", "heavy_rain", "extreme_rain"]
    actual_rain = 0
    if isinstance(req.weather_snapshot.get("rain"), dict):
        actual_rain = req.weather_snapshot["rain"].get("1h", 0)
    elif "rainfall" in req.weather_snapshot:
        actual_rain = req.weather_snapshot.get("rainfall", 0)
    weather_mismatch = claimed_rain and actual_rain < 0.5

    fv["weather_mismatch"] = weather_mismatch
    signal_count = count_independent_signals(fv)

    # Rule engine decision
    shock_event = fv.get("shock_event_count", 0) > 0
    speed_at_event = req.activity_window[-1].get("speed", 0) if req.activity_window else 0

    rule_decision = apply_rules(
        risk_score=risk_score,
        fraud_score=0,
        anomaly_score=anomaly_score,
        shock_event=shock_event,
        speed_at_event=speed_at_event,
        weather_mismatch=weather_mismatch,
        independent_signal_count=signal_count,
    )

    # LLM reasoning — only for non-trivial cases and only if API key detected
    llm_result = {
        "decision_support": "skip",
        "reason": "LLM skipped — low risk case or API key not configured.",
        "confidence": 0.0,
        "top_flags": [],
        "llm_used": False,
    }

    if LLM_ENABLED:
        # Skip LLM for very low risk (save cost + latency)
        if risk_score < 0.2 and anomaly_score < 0.15:
            llm_result = {
                "decision_support": "approve",
                "reason": "Low risk — LLM skipped for efficiency.",
                "confidence": 0.95,
                "top_flags": [],
                "llm_used": False,
            }
        else:
            llm_result = get_llm_decision(
                claim_data=req.claim_data,
                scores={"risk_score": risk_score, "anomaly_score": anomaly_score},
                feature_vector=fv,
            )

    return {
        "rule_decision": rule_decision,
        "llm_decision": llm_result,
        "scores": {
            "risk_score": risk_score,
            "anomaly_score": anomaly_score,
            "estimated_earnings": estimated_earnings,
        },
        "independent_signal_count": signal_count,
        "weather_mismatch": weather_mismatch,
        "top_features": list(fv.keys())[:8],
    }


# ── GET /health ───────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "risk": "loaded" if risk_model else "not_found",
            "earnings": "loaded" if earnings_model else "not_found",
            "fraud": "loaded" if fraud_model else "not_found",
        },
        "llm_enabled": LLM_ENABLED,
    }
