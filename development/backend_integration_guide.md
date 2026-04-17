# Backend & AI/ML Integration Guide
## AI-Powered Parametric Insurance for Gig Workers

> **Purpose:** This document is an implementation guide for building and integrating the backend and AI/ML pipeline. Use it step by step to scaffold the system, wire up APIs, and deploy the decision engine.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Database Schema](#2-database-schema)
3. [Feature Engineering](#3-feature-engineering)
4. [AI/ML Models](#4-aiml-models)
5. [Rule Engine](#5-rule-engine)
6. [LLM Integration (Claude)](#6-llm-integration-claude)
7. [FastAPI Prediction Service](#7-fastapi-prediction-service)
8. [Parametric Trigger System](#8-parametric-trigger-system)
9. [Fraud Detection Engine](#9-fraud-detection-engine)
10. [Dynamic Pricing Engine](#10-dynamic-pricing-engine)
11. [Payout Pipeline](#11-payout-pipeline)
12. [Node.js Backend (Express)](#12-nodejs-backend-express)
13. [Environment Variables](#13-environment-variables)
14. [API Reference](#14-api-reference)
15. [Deployment Notes](#15-deployment-notes)

---

## 1. Project Structure

```
project-root/
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── workers.js
│   │   │   ├── claims.js
│   │   │   ├── payouts.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── fraud-check.js
│   │   ├── services/
│   │   │   ├── weather.js       # OpenWeather API wrapper
│   │   │   ├── maps.js          # Google Maps API wrapper
│   │   │   ├── payment.js       # Razorpay integration
│   │   │   └── ml-client.js     # HTTP client → FastAPI
│   │   └── app.js
│   └── package.json
│
├── ml-service/                 # Python FastAPI
│   ├── models/
│   │   ├── risk.pkl
│   │   ├── earnings.pkl
│   │   └── fraud.pkl
│   ├── main.py                  # FastAPI app
│   ├── features.py              # Feature engineering
│   ├── rules.py                 # Rule engine
│   ├── llm.py                   # Claude integration
│   ├── train.py                 # Model training script
│   └── requirements.txt
│
├── frontend/                   # React.js + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── WorkerDashboard.jsx
│       │   └── AdminDashboard.jsx
│       └── components/
│
└── docker-compose.yml
```

---

## 2. Database Schema

Use **MongoDB** as the primary database and **Redis** for caching session data and claim snapshots.

### 2.1 Collections

#### `riders`
```json
{
  "rider_id": "string (UUID)",
  "name": "string",
  "phone": "string",
  "platform": "swiggy | zomato | ola | uber | amazon",
  "zone": "string (city zone identifier)",
  "device_id": "string",
  "insurance_active": "boolean",
  "premium_amount": "number",
  "trust_score": "number (0–100)",
  "spoofing_score": "number (0–100)",
  "created_at": "datetime",
  "subscription_id": "string (Razorpay)"
}
```

#### `rider_activity`
```json
{
  "rider_id": "string",
  "timestamp": "datetime",
  "gps_lat": "float",
  "gps_lng": "float",
  "accuracy_meters": "float",
  "speed": "float",
  "heading": "float",
  "device_id": "string",
  "accelerometer": "float",
  "gyro": "float",
  "step_count": "number",
  "network_type": "string",
  "ip_address": "string"
}
```

> **Note:** `accuracy_meters` is critical. Discard GPS readings where accuracy > 50m — they are too imprecise for fraud detection.

#### `order_events`
```json
{
  "order_id": "string",
  "rider_id": "string",
  "pickup_time": "datetime",
  "drop_time": "datetime",
  "status": "completed | cancelled | pending",
  "distance_km": "float",
  "earnings": "number"
}
```

#### `sensor_data`
```json
{
  "rider_id": "string",
  "timestamp": "datetime",
  "acceleration": "float",
  "gyro": "float",
  "shock_event": "boolean"
}
```

#### `claims`
```json
{
  "claim_id": "string (UUID)",
  "rider_id": "string",
  "claim_type": "rain | flood | curfew | pollution | accident",
  "claim_time": "datetime",
  "reported_issue": "string",
  "weather_snapshot": "object (full API response at claim time)",
  "traffic_snapshot": "object (Google Maps response at claim time)",
  "gps_at_claim": { "lat": "float", "lng": "float" },
  "risk_score": "float",
  "fraud_score": "float",
  "anomaly_score": "float",
  "llm_decision": "approve | review | reject",
  "llm_reason": "string",
  "final_decision": "approve | review | reject",
  "status": "pending | paid | flagged | appealed"
}
```

> **Critical:** Always capture `weather_snapshot` and `traffic_snapshot` at the exact moment a claim is submitted. This is your ground truth for environmental matching. Store it even if the claim is rejected.

#### `fraud_appeals`
```json
{
  "appeal_id": "string",
  "claim_id": "string",
  "rider_id": "string",
  "submitted_at": "datetime",
  "evidence_text": "string",
  "evidence_image_url": "string",
  "reviewer_decision": "approved | rejected | pending",
  "reviewer_notes": "string",
  "resolved_at": "datetime"
}
```

### 2.2 Redis Keys

```
session:{rider_id}          → JWT session data (TTL: 24h)
claim_snapshot:{claim_id}   → Weather + GPS snapshot at claim time (TTL: 7 days)
trust_score:{rider_id}      → Cached trust score (TTL: 1h)
zone_risk:{zone_id}         → Zone risk score (TTL: 6h)
```

---

## 3. Feature Engineering

File: `ml-service/features.py`

Convert raw GPS, order, sensor, and weather data into ML-ready signals.

```python
import pandas as pd
import numpy as np
from geopy.distance import geodesic

def compute_gps_features(activity_df: pd.DataFrame) -> dict:
    """
    Input: DataFrame of rider_activity rows for a time window.
    Output: Dictionary of GPS-derived features.
    """
    # Filter out low-accuracy readings
    df = activity_df[activity_df['accuracy_meters'] < 50].copy()

    # Speed anomaly: deviation from expected speed for zone
    avg_speed = df['speed'].mean()
    speed_std = df['speed'].std()

    # Idle time ratio: % of time with speed < 2 km/h
    idle_ratio = (df['speed'] < 2).sum() / len(df)

    # Teleportation detection: sudden jumps > 500m between consecutive readings
    coords = list(zip(df['gps_lat'], df['gps_lng']))
    jump_events = 0
    for i in range(1, len(coords)):
        dist = geodesic(coords[i-1], coords[i]).meters
        time_diff = (df['timestamp'].iloc[i] - df['timestamp'].iloc[i-1]).seconds
        if dist > 500 and time_diff < 60:
            jump_events += 1

    return {
        "avg_speed": avg_speed,
        "speed_std": speed_std,
        "idle_time_ratio": idle_ratio,
        "gps_jump_count": jump_events,
    }


def compute_behavioral_features(orders_df: pd.DataFrame, window_days: int = 7) -> dict:
    """
    Input: DataFrame of order_events for the last N days.
    Output: Behavioral feature dictionary.
    """
    total = len(orders_df)
    cancelled = (orders_df['status'] == 'cancelled').sum()

    cancellation_rate = cancelled / total if total > 0 else 0
    avg_earnings = orders_df['earnings'].mean() if total > 0 else 0
    orders_per_day = total / window_days

    return {
        "cancellation_rate": cancellation_rate,
        "avg_daily_orders": orders_per_day,
        "avg_earnings_per_order": avg_earnings,
        "total_orders_window": total,
    }


def compute_sensor_features(sensor_df: pd.DataFrame) -> dict:
    """
    Input: DataFrame of sensor_data rows.
    Output: Sensor-derived features.
    """
    shock_events = sensor_df['shock_event'].sum()
    avg_acceleration = sensor_df['acceleration'].mean()
    inactivity_ratio = (sensor_df['acceleration'] < 0.1).sum() / len(sensor_df)

    return {
        "shock_event_count": int(shock_events),
        "avg_acceleration": avg_acceleration,
        "sensor_inactivity_ratio": inactivity_ratio,
    }


def compute_environmental_features(weather_snapshot: dict, traffic_snapshot: dict) -> dict:
    """
    Input: Weather and traffic API snapshots at claim time.
    Output: Environmental signals for fraud matching.
    """
    rain_intensity = weather_snapshot.get("rain", {}).get("1h", 0)
    aqi = weather_snapshot.get("aqi", 0)
    wind_speed = weather_snapshot.get("wind", {}).get("speed", 0)
    traffic_duration_ratio = traffic_snapshot.get("duration_in_traffic", 1) / max(traffic_snapshot.get("duration", 1), 1)

    return {
        "rain_intensity_mm": rain_intensity,
        "aqi": aqi,
        "wind_speed": wind_speed,
        "traffic_congestion_ratio": traffic_duration_ratio,
    }


def build_feature_vector(gps_feats, behavior_feats, sensor_feats, env_feats) -> dict:
    """Merge all feature groups into a single flat vector for model input."""
    return {
        **gps_feats,
        **behavior_feats,
        **sensor_feats,
        **env_feats,
    }
```

---

## 4. AI/ML Models

File: `ml-service/train.py`

### 4.1 Risk Prediction Model (XGBoost)

Predicts the probability of a legitimate income disruption event in a given zone and time window.

```python
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
import joblib
import pandas as pd

def train_risk_model(df: pd.DataFrame):
    """
    Input DataFrame columns (minimum):
      rain_intensity_mm, aqi, wind_speed, traffic_congestion_ratio,
      zone_risk_score, hour_of_day, day_of_week, disruption_occurred (label)
    """
    feature_cols = [
        "rain_intensity_mm", "aqi", "wind_speed", "traffic_congestion_ratio",
        "zone_risk_score", "hour_of_day", "day_of_week"
    ]
    X = df[feature_cols]
    y = df["disruption_occurred"]  # 1 = disruption confirmed, 0 = no disruption

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss"
    )
    model.fit(X_train, y_train)

    joblib.dump(model, "models/risk.pkl")
    print(f"Risk model accuracy: {model.score(X_test, y_test):.3f}")
    return model
```

> **For MVP without labeled data:** Use the rule-based fallback in Section 5 to simulate risk scores. Train the XGBoost model once you have 30+ real claim records.

### 4.2 Earnings Prediction Model (LightGBM)

Estimates expected daily earnings for a worker in a given zone, used to calculate payout amount.

```python
import lightgbm as lgb

def train_earnings_model(df: pd.DataFrame):
    """
    Input DataFrame columns:
      avg_daily_orders, zone_risk_score, platform, hour_of_day,
      day_of_week, weather_condition, expected_earnings (label)
    """
    feature_cols = [
        "avg_daily_orders", "zone_risk_score", "hour_of_day",
        "day_of_week", "rain_intensity_mm"
    ]
    X = df[feature_cols]
    y = df["expected_earnings"]

    train_data = lgb.Dataset(X, label=y)
    params = {
        "objective": "regression",
        "metric": "rmse",
        "num_leaves": 31,
        "learning_rate": 0.05,
        "n_estimators": 200
    }
    model = lgb.train(params, train_data, num_boost_round=200)

    joblib.dump(model, "models/earnings.pkl")
    return model
```

### 4.3 Fraud Detection Model (Isolation Forest)

Detects anomalous behavior patterns that deviate from the rider's historical baseline.

```python
from sklearn.ensemble import IsolationForest

def train_fraud_model(df: pd.DataFrame):
    """
    Input DataFrame columns (normal/baseline behavior only — no fraud labels needed):
      idle_time_ratio, gps_jump_count, cancellation_rate,
      sensor_inactivity_ratio, avg_speed, shock_event_count
    """
    feature_cols = [
        "idle_time_ratio", "gps_jump_count", "cancellation_rate",
        "sensor_inactivity_ratio", "avg_speed", "shock_event_count"
    ]
    X = df[feature_cols]

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,  # Assume ~5% of data is anomalous
        random_state=42
    )
    model.fit(X)

    joblib.dump(model, "models/fraud.pkl")
    return model
```

> **Note:** Isolation Forest does not need fraud labels. Train it only on known-good (normal) behavior data. The model learns what "normal" looks like and flags deviations. Contamination of 0.05 means it expects 5% anomalies — tune this up if you see too many false positives.

### 4.4 Loading Models at Runtime

```python
# ml-service/main.py (top of file)
import joblib

risk_model = joblib.load("models/risk.pkl")
earnings_model = joblib.load("models/earnings.pkl")
fraud_model = joblib.load("models/fraud.pkl")
```

---

## 5. Rule Engine

File: `ml-service/rules.py`

Hard constraints that override ML scores. This makes the system legally auditable and deterministic for edge cases.

```python
def apply_rules(
    risk_score: float,
    fraud_score: float,
    anomaly_score: float,
    shock_event: bool,
    speed_at_event: float,
    weather_mismatch: bool,
    independent_signal_count: int
) -> dict:
    """
    Returns a decision dict with action and reason.
    
    Parameters:
      risk_score          : float 0–1, from XGBoost
      fraud_score         : float (Isolation Forest decision_function output; lower = more anomalous)
      anomaly_score       : float 0–1 (normalized fraud_score)
      shock_event         : bool, from sensor data
      speed_at_event      : float, GPS speed at claim time
      weather_mismatch    : bool, True if claimed weather ≠ actual weather in rider's GPS zone
      independent_signal_count : int, number of independent fraud signals that agree
    """

    # Auto-approve: physical accident evidence (sensor + speed)
    if shock_event and speed_at_event > 40:
        return {"decision": "auto_approve", "reason": "Shock event detected at high speed — likely accident."}

    # Hard reject: environmental mismatch is the strongest signal
    if weather_mismatch:
        return {"decision": "reject", "reason": "Claimed weather condition does not match GPS zone data."}

    # Hard reject: very high fraud probability
    if anomaly_score > 0.85:
        return {"decision": "reject", "reason": "Anomaly score exceeds threshold — high fraud probability."}

    # Flag for manual review: multiple signals agree (require at least 2)
    if independent_signal_count >= 2 and anomaly_score > 0.5:
        return {"decision": "manual_review", "reason": f"{independent_signal_count} independent fraud signals detected."}

    # Flag for manual review: elevated risk + elevated anomaly
    if risk_score > 0.7 and anomaly_score > 0.4:
        return {"decision": "manual_review", "reason": "Elevated risk and anomaly scores — pending verification."}

    # Low risk: approve
    if risk_score < 0.3 and anomaly_score < 0.2:
        return {"decision": "auto_approve", "reason": "Low risk and no anomaly signals detected."}

    # Default: light verification
    return {"decision": "verify", "reason": "Borderline scores — light verification required."}


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
```

---

## 6. LLM Integration (Claude)

File: `ml-service/llm.py`

Use Claude (via Anthropic API) for explainability and decision support. Claude provides reasoning that business teams and auditors can read.

```python
import anthropic
import json

client = anthropic.Anthropic()  # Reads ANTHROPIC_API_KEY from environment

FRAUD_ANALYST_PROMPT = """You are an insurance fraud analyst for a parametric insurance platform serving gig delivery workers in India.

You will receive structured claim data including GPS activity, environmental conditions, behavioral signals, and ML model scores.

Your task:
1. Assess whether the claim is suspicious based on the provided signals only.
2. Provide clear, concise reasoning.
3. Suggest one of: approve | manual_review | reject

Rules you must follow:
- Only flag fraud if at least 2 independent signals agree.
- Do NOT hallucinate — use only the data provided.
- Be conservative — when in doubt, suggest manual_review over reject.
- Output valid JSON only. No markdown, no prose outside the JSON.

Output format:
{
  "decision_support": "approve | manual_review | reject",
  "reason": "one or two sentence explanation",
  "confidence": 0.0 to 1.0,
  "top_flags": ["list", "of", "active", "signal", "names"]
}"""


def get_llm_decision(claim_data: dict, scores: dict, feature_vector: dict) -> dict:
    """
    Call Claude to get an explainable fraud decision.
    
    Parameters:
      claim_data     : raw claim fields (type, time, location)
      scores         : {risk_score, anomaly_score, fraud_score}
      feature_vector : computed feature dict from features.py
    
    Returns: parsed JSON dict with decision_support, reason, confidence, top_flags
    """
    user_message = f"""
Claim data: {json.dumps(claim_data, default=str)}

ML scores:
- Risk score (disruption probability): {scores.get('risk_score', 'N/A')}
- Anomaly score (fraud likelihood): {scores.get('anomaly_score', 'N/A')}

Behavioral and environmental signals:
{json.dumps(feature_vector, indent=2)}

Analyze this claim and respond with your JSON assessment.
"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=FRAUD_ANALYST_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )

        raw = message.content[0].text.strip()
        return json.loads(raw)

    except json.JSONDecodeError:
        # Fallback if Claude returns non-JSON
        return {
            "decision_support": "manual_review",
            "reason": "LLM response could not be parsed — defaulting to manual review.",
            "confidence": 0.0,
            "top_flags": []
        }
    except Exception as e:
        # Fallback if API call fails
        return {
            "decision_support": "manual_review",
            "reason": f"LLM unavailable ({str(e)}) — defaulting to manual review.",
            "confidence": 0.0,
            "top_flags": []
        }
```

> **Performance tip:** Skip the LLM call for very low-risk cases (risk_score < 0.2 and anomaly_score < 0.15). Auto-approve them directly from the rule engine. This reduces API costs and latency significantly.

---

## 7. FastAPI Prediction Service

File: `ml-service/main.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
from features import (
    compute_gps_features, compute_behavioral_features,
    compute_sensor_features, compute_environmental_features, build_feature_vector
)
from rules import apply_rules, count_independent_signals
from llm import get_llm_decision

app = FastAPI(title="Parametric Insurance ML Service")

# Load models on startup
risk_model = joblib.load("models/risk.pkl")
earnings_model = joblib.load("models/earnings.pkl")
fraud_model = joblib.load("models/fraud.pkl")

FEATURE_COLS = [
    "avg_speed", "idle_time_ratio", "gps_jump_count",
    "cancellation_rate", "avg_daily_orders", "sensor_inactivity_ratio",
    "shock_event_count", "rain_intensity_mm", "aqi",
    "wind_speed", "traffic_congestion_ratio"
]


class ClaimRequest(BaseModel):
    rider_id: str
    claim_data: dict         # Raw claim fields
    activity_window: list    # List of rider_activity records (last 2 hours)
    order_window: list       # List of order_events (last 7 days)
    sensor_window: list      # List of sensor_data records (last 2 hours)
    weather_snapshot: dict   # From OpenWeather at claim time
    traffic_snapshot: dict   # From Google Maps at claim time


@app.post("/predict")
def predict(req: ClaimRequest):
    """Fast scoring endpoint — returns scores only, no LLM call."""
    try:
        import pandas as pd

        activity_df = pd.DataFrame(req.activity_window)
        orders_df = pd.DataFrame(req.order_window)
        sensor_df = pd.DataFrame(req.sensor_window)

        gps_feats = compute_gps_features(activity_df)
        behavior_feats = compute_behavioral_features(orders_df)
        sensor_feats = compute_sensor_features(sensor_df)
        env_feats = compute_environmental_features(req.weather_snapshot, req.traffic_snapshot)

        fv = build_feature_vector(gps_feats, behavior_feats, sensor_feats, env_feats)
        feature_row = [fv.get(col, 0) for col in FEATURE_COLS]

        risk_score = float(risk_model.predict_proba([feature_row])[0][1])
        fraud_raw = float(fraud_model.decision_function([feature_row])[0])
        # Normalize isolation forest score to 0–1 (lower = more anomalous → higher fraud score)
        anomaly_score = float(np.clip(1 - (fraud_raw + 0.5), 0, 1))

        return {
            "risk_score": risk_score,
            "anomaly_score": anomaly_score,
            "feature_vector": fv
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decision")
def decision(req: ClaimRequest):
    """Full pipeline: scoring + rule engine + LLM reasoning."""
    scores_resp = predict(req)

    risk_score = scores_resp["risk_score"]
    anomaly_score = scores_resp["anomaly_score"]
    fv = scores_resp["feature_vector"]

    # Detect weather mismatch (claimed weather vs actual GPS zone weather)
    claimed_rain = req.claim_data.get("claim_type") == "rain"
    actual_rain = req.weather_snapshot.get("rain", {}).get("1h", 0) > 0.5
    weather_mismatch = claimed_rain and not actual_rain

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
        independent_signal_count=signal_count
    )

    # Skip LLM for very low risk cases (save cost + latency)
    if risk_score < 0.2 and anomaly_score < 0.15:
        llm_result = {
            "decision_support": "approve",
            "reason": "Low risk — LLM skipped for efficiency.",
            "confidence": 0.95,
            "top_flags": []
        }
    else:
        llm_result = get_llm_decision(
            claim_data=req.claim_data,
            scores={"risk_score": risk_score, "anomaly_score": anomaly_score},
            feature_vector=fv
        )

    return {
        "rule_decision": rule_decision,
        "llm_decision": llm_result,
        "scores": {
            "risk_score": risk_score,
            "anomaly_score": anomaly_score,
        },
        "top_features": list(fv.keys())[:5]
    }


@app.get("/health")
def health():
    return {"status": "ok"}
```

### Running the ML Service

```bash
cd ml-service
pip install fastapi uvicorn xgboost lightgbm scikit-learn pandas numpy geopy anthropic joblib

uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 8. Parametric Trigger System

File: `backend/src/services/weather.js`

This is the core of parametric insurance. Triggers fire automatically when real-world conditions exceed defined thresholds — no manual claim needed.

```javascript
const axios = require('axios');

const TRIGGERS = {
  heavy_rain:   { field: 'rain.1h',      threshold: 15,   unit: 'mm/h' },
  extreme_rain: { field: 'rain.1h',      threshold: 50,   unit: 'mm/h' },
  high_aqi:     { field: 'aqi',          threshold: 200,  unit: 'AQI index' },
  severe_aqi:   { field: 'aqi',          threshold: 300,  unit: 'AQI index' },
  flood_risk:   { field: 'rain.3h',      threshold: 75,   unit: 'mm/3h' },
};

async function getWeatherSnapshot(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather`;
  const res = await axios.get(url, {
    params: { lat, lon: lng, appid: process.env.OPENWEATHER_API_KEY, units: 'metric' }
  });
  return res.data;
}

async function getAQISnapshot(lat, lng) {
  const url = `https://api.openaq.org/v2/latest`;
  const res = await axios.get(url, {
    params: { coordinates: `${lat},${lng}`, radius: 5000, limit: 1 }
  });
  return res.data?.results?.[0] || {};
}

function evaluateTriggers(weatherData, aqiData) {
  const fired = [];

  const rain1h = weatherData?.rain?.['1h'] || 0;
  const rain3h = weatherData?.rain?.['3h'] || 0;
  const aqi = aqiData?.measurements?.find(m => m.parameter === 'pm25')?.value || 0;

  if (rain1h >= TRIGGERS.extreme_rain.threshold) fired.push('extreme_rain');
  else if (rain1h >= TRIGGERS.heavy_rain.threshold) fired.push('heavy_rain');
  if (rain3h >= TRIGGERS.flood_risk.threshold) fired.push('flood_risk');
  if (aqi >= TRIGGERS.severe_aqi.threshold) fired.push('severe_aqi');
  else if (aqi >= TRIGGERS.high_aqi.threshold) fired.push('high_aqi');

  return {
    triggers_fired: fired,
    auto_trigger: fired.length > 0,
    rain_1h_mm: rain1h,
    rain_3h_mm: rain3h,
    aqi_pm25: aqi,
    raw_weather: weatherData,
  };
}

module.exports = { getWeatherSnapshot, getAQISnapshot, evaluateTriggers };
```

### Payout Amounts Per Trigger

```javascript
// backend/src/config/payout-rules.js
module.exports = {
  heavy_rain:   { payout_percent: 0.30, label: 'Heavy rain (15mm+/hr)' },
  extreme_rain: { payout_percent: 0.60, label: 'Extreme rain (50mm+/hr)' },
  flood_risk:   { payout_percent: 0.80, label: 'Flood risk (75mm+ over 3hr)' },
  high_aqi:     { payout_percent: 0.25, label: 'Poor air quality (AQI 200+)' },
  severe_aqi:   { payout_percent: 0.50, label: 'Hazardous air quality (AQI 300+)' },
};
```

---

## 9. Fraud Detection Engine

File: `backend/src/middleware/fraud-check.js`

A middleware layer that is called before any claim is processed.

```javascript
const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

async function runFraudCheck(claimPayload) {
  const res = await axios.post(`${ML_SERVICE_URL}/decision`, claimPayload);
  return res.data;
}

function resolveEscalation(mlDecision) {
  const { rule_decision, llm_decision, scores } = mlDecision;

  // If both rule engine and LLM agree on reject — hard reject
  if (rule_decision.decision === 'reject' && llm_decision.decision_support === 'reject') {
    return { action: 'reject', delay_ms: 0 };
  }

  // Manual review: delay payout, require verification
  if (rule_decision.decision === 'manual_review' || llm_decision.decision_support === 'manual_review') {
    return { action: 'manual_review', delay_ms: 24 * 60 * 60 * 1000 }; // 24h hold
  }

  // Auto approve
  return { action: 'approve', delay_ms: 0 };
}

module.exports = { runFraudCheck, resolveEscalation };
```

---

## 10. Dynamic Pricing Engine

File: `backend/src/services/pricing.js`

Calculates a weekly premium dynamically based on zone risk and worker history.

```javascript
const ZONE_RISK_SCORES = {
  'chennai-north': 0.75,   // flood-prone
  'chennai-south': 0.45,
  'chennai-central': 0.55,
  // Add zones for your city
};

const BASE_PREMIUM = 49;  // INR per week (minimum)
const MAX_PREMIUM = 149;  // INR per week (maximum)

function calculatePremium(riderId, zone, trustScore, activityLevel) {
  const zoneRisk = ZONE_RISK_SCORES[zone] || 0.5;

  // Higher trust score = lower premium (reward reliable workers)
  const trustDiscount = (trustScore / 100) * 0.2;

  // Higher activity = higher exposure = higher premium
  const activityMultiplier = 1 + (activityLevel / 10) * 0.15;

  const rawPremium = BASE_PREMIUM * (1 + zoneRisk) * activityMultiplier * (1 - trustDiscount);
  const premium = Math.min(MAX_PREMIUM, Math.max(BASE_PREMIUM, Math.round(rawPremium)));

  return {
    premium_inr: premium,
    zone_risk_score: zoneRisk,
    trust_discount_applied: trustDiscount,
    breakdown: { base: BASE_PREMIUM, zone_multiplier: zoneRisk, activity_multiplier: activityMultiplier }
  };
}

module.exports = { calculatePremium };
```

---

## 11. Payout Pipeline

File: `backend/src/services/payment.js`

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function triggerPayout(claimId, riderId, amountINR, reason) {
  // In test mode, log payout simulation
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SIMULATED PAYOUT] Claim: ${claimId} | Rider: ${riderId} | Amount: ₹${amountINR} | Reason: ${reason}`);
    return { simulated: true, claim_id: claimId, amount: amountINR };
  }

  // Production: use Razorpay payout API
  const payout = await razorpay.payouts.create({
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
    fund_account_id: riderId,
    amount: amountINR * 100,  // Razorpay uses paise
    currency: 'INR',
    mode: 'UPI',
    purpose: 'insurance_payout',
    narration: `Parametric insurance payout: ${reason}`,
    reference_id: claimId,
  });

  return payout;
}

async function collectPremium(riderId, amountINR, subscriptionId) {
  // Razorpay subscription handles recurring weekly premium collection
  // Set up subscription on worker onboarding; this function handles one-time top-up if needed
  console.log(`Premium collection for rider ${riderId}: ₹${amountINR}`);
}

module.exports = { triggerPayout, collectPremium };
```

---

## 12. Node.js Backend (Express)

File: `backend/src/routes/claims.js`

```javascript
const express = require('express');
const router = express.Router();
const { getWeatherSnapshot, getAQISnapshot, evaluateTriggers } = require('../services/weather');
const { runFraudCheck, resolveEscalation } = require('../middleware/fraud-check');
const { triggerPayout } = require('../services/payment');
const { calculatePremium } = require('../services/pricing');
const Claim = require('../models/Claim');
const Rider = require('../models/Rider');

// POST /api/claims/submit
router.post('/submit', async (req, res) => {
  const { rider_id, claim_type, gps_lat, gps_lng, reported_issue } = req.body;

  try {
    // Step 1: Capture environmental snapshots at claim time (critical — do this first)
    const [weatherSnapshot, aqiData] = await Promise.all([
      getWeatherSnapshot(gps_lat, gps_lng),
      getAQISnapshot(gps_lat, gps_lng)
    ]);
    const triggerResult = evaluateTriggers(weatherSnapshot, aqiData);

    // Step 2: Fetch rider's recent activity from MongoDB
    const activityWindow = await RiderActivity.find({ rider_id }).sort({ timestamp: -1 }).limit(200);
    const orderWindow = await OrderEvent.find({ rider_id }).sort({ pickup_time: -1 }).limit(100);
    const sensorWindow = await SensorData.find({ rider_id }).sort({ timestamp: -1 }).limit(200);

    // Step 3: Run full ML + LLM fraud check
    const mlDecision = await runFraudCheck({
      rider_id,
      claim_data: { claim_type, reported_issue, gps_lat, gps_lng },
      activity_window: activityWindow,
      order_window: orderWindow,
      sensor_window: sensorWindow,
      weather_snapshot: { ...weatherSnapshot, aqi: aqiData },
      traffic_snapshot: {}  // Add Google Maps call here
    });

    const escalation = resolveEscalation(mlDecision);

    // Step 4: Save claim record
    const claim = await Claim.create({
      rider_id,
      claim_type,
      reported_issue,
      gps_at_claim: { lat: gps_lat, lng: gps_lng },
      weather_snapshot: weatherSnapshot,
      risk_score: mlDecision.scores.risk_score,
      anomaly_score: mlDecision.scores.anomaly_score,
      llm_decision: mlDecision.llm_decision.decision_support,
      llm_reason: mlDecision.llm_decision.reason,
      final_decision: escalation.action,
      status: escalation.action === 'approve' ? 'paid' : 'pending'
    });

    // Step 5: Trigger payout if approved
    if (escalation.action === 'approve' && triggerResult.auto_trigger) {
      const rider = await Rider.findOne({ rider_id });
      const payoutAmount = Math.round(rider.premium_amount * 3);  // 3x weekly premium as claim payout
      await triggerPayout(claim._id.toString(), rider_id, payoutAmount, claim_type);
    }

    return res.json({
      claim_id: claim._id,
      decision: escalation.action,
      reason: mlDecision.llm_decision.reason,
      triggers_fired: triggerResult.triggers_fired,
    });

  } catch (err) {
    console.error('Claim submission error:', err);
    res.status(500).json({ error: 'Claim processing failed' });
  }
});

module.exports = router;
```

---

## 13. Environment Variables

Create a `.env` file at the project root. **Never commit this file to git.**

```env
# Node.js backend
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/parametric-insurance
REDIS_URL=redis://localhost:6379

# External APIs
OPENWEATHER_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_key_here
RAZORPAY_ACCOUNT_NUMBER=your_account_here

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Python ML service
ANTHROPIC_API_KEY=your_anthropic_key_here
```

---

## 14. API Reference

| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| POST | `/api/claims/submit` | Node.js | Submit a new insurance claim |
| GET | `/api/claims/:id` | Node.js | Get claim status and decision |
| POST | `/api/claims/:id/appeal` | Node.js | Submit an appeal for a rejected claim |
| GET | `/api/workers/:id/premium` | Node.js | Get dynamic premium for a worker |
| GET | `/api/workers/:id/dashboard` | Node.js | Worker dashboard data |
| POST | `/api/admin/workers` | Node.js | Register a new worker |
| POST | `/predict` | FastAPI (ML) | Fast ML scoring (no LLM) |
| POST | `/decision` | FastAPI (ML) | Full decision pipeline with LLM |
| GET | `/health` | FastAPI (ML) | Health check |

---

## 15. Deployment Notes

### Phase 1 — MVP (Current Phase)
- Rule engine + ML scoring active for all claims
- LLM (Claude) runs in **explanation mode only** — its output is shown on the dashboard but does not block payouts
- All payouts are simulated (logged, not sent)
- Manual review queue managed by admin dashboard

### Phase 2 — Partial Automation
- LLM decision is incorporated into escalation logic
- Razorpay payouts go live for auto-approved claims
- Human-in-the-loop for manual_review cases

### Phase 3 — Full Automation
- Retrain XGBoost and LightGBM on real claim data (minimum 30 labeled records)
- Enable Kafka for real-time GPS ingestion (replace polling)
- Cross-user correlation (fraud ring detection) added as a background job

### Running Locally

```bash
# Start MongoDB and Redis
docker-compose up -d mongo redis

# Start ML service
cd ml-service && uvicorn main:app --port 8001 --reload

# Start Node.js backend
cd backend && npm install && npm run dev

# Start React frontend
cd frontend && npm install && npm start
```

### Docker Compose (Minimal)

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  ml-service:
    build: ./ml-service
    ports: ["8001:8001"]
    env_file: .env

  backend:
    build: ./backend
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [mongo, redis, ml-service]

volumes:
  mongo_data:
```

---

*Last updated: April 2026 — for use with Antigravity IDE backend scaffolding*