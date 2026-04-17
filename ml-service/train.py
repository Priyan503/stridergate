"""
Model Training Script — Trains all 3 ML models with synthetic data.

Models:
  1. Risk Model     (XGBoost)         → models/risk.pkl
  2. Earnings Model (LightGBM)        → models/earnings.pkl
  3. Fraud Model    (Isolation Forest) → models/fraud.pkl

For MVP: Uses synthetic data. Retrain on real data when 30+ labeled records available.
"""

import os
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
import lightgbm as lgb

# Ensure models directory exists
os.makedirs("models", exist_ok=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4.1 Risk Prediction Model (XGBoost)
# Predicts probability of a legitimate income disruption event
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_risk_data(n=2000):
    """Generate synthetic training data for risk prediction."""
    np.random.seed(42)
    data = {
        "rain_intensity_mm": np.random.exponential(5, n),
        "aqi": np.random.uniform(50, 400, n),
        "wind_speed": np.random.normal(15, 8, n).clip(0),
        "traffic_congestion_ratio": np.random.uniform(0.8, 3.0, n),
        "zone_risk_score": np.random.uniform(0, 1, n),
        "hour_of_day": np.random.randint(0, 24, n),
        "day_of_week": np.random.randint(0, 7, n),
    }
    df = pd.DataFrame(data)
    # Label: disruption likely if heavy rain + high zone risk OR extreme AQI
    df["disruption_occurred"] = (
        ((df["rain_intensity_mm"] > 20) & (df["zone_risk_score"] > 0.6))
        | (df["aqi"] > 300)
    ).astype(int)
    return df


def train_risk_model():
    print("=" * 60)
    print("Training Risk Model (XGBoost)...")
    print("=" * 60)

    df = generate_risk_data()
    feature_cols = [
        "rain_intensity_mm", "aqi", "wind_speed", "traffic_congestion_ratio",
        "zone_risk_score", "hour_of_day", "day_of_week",
    ]
    X = df[feature_cols]
    y = df["disruption_occurred"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"  Accuracy: {accuracy:.3f}")
    print(f"  Positive class ratio: {y.sum()/len(y):.2%}")

    joblib.dump(model, "models/risk.pkl")
    print("  [OK] Saved: models/risk.pkl")
    return model


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4.2 Earnings Prediction Model (LightGBM)
# Estimates expected daily earnings for payout calculation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_earnings_data(n=2000):
    """Generate synthetic training data for earnings prediction."""
    np.random.seed(123)
    data = {
        "avg_daily_orders": np.random.uniform(5, 30, n),
        "zone_risk_score": np.random.uniform(0, 1, n),
        "hour_of_day": np.random.randint(6, 23, n),
        "day_of_week": np.random.randint(0, 7, n),
        "rain_intensity_mm": np.random.exponential(3, n),
    }
    df = pd.DataFrame(data)

    # Expected earnings: base from orders, reduced by rain and zone risk
    base_earnings = df["avg_daily_orders"] * np.random.uniform(30, 60, n)
    rain_penalty = df["rain_intensity_mm"] * np.random.uniform(5, 15, n)
    zone_penalty = df["zone_risk_score"] * np.random.uniform(50, 150, n)

    # Weekend bonus
    weekend_bonus = np.where(df["day_of_week"].isin([5, 6]), 100, 0)

    # Peak hour bonus (11-14, 18-22)
    peak_bonus = np.where(
        df["hour_of_day"].isin([11, 12, 13, 14, 18, 19, 20, 21, 22]), 80, 0
    )

    df["expected_earnings"] = (
        base_earnings - rain_penalty - zone_penalty + weekend_bonus + peak_bonus
    ).clip(100, 2500)

    return df


def train_earnings_model():
    print("\n" + "=" * 60)
    print("Training Earnings Model (LightGBM)...")
    print("=" * 60)

    df = generate_earnings_data()
    feature_cols = [
        "avg_daily_orders", "zone_risk_score", "hour_of_day",
        "day_of_week", "rain_intensity_mm",
    ]
    X = df[feature_cols]
    y = df["expected_earnings"]

    train_data = lgb.Dataset(X, label=y)
    params = {
        "objective": "regression",
        "metric": "rmse",
        "num_leaves": 31,
        "learning_rate": 0.05,
        "n_estimators": 200,
        "verbose": -1,
    }
    model = lgb.train(params, train_data, num_boost_round=200)

    # Quick evaluation
    predictions = model.predict(X)
    rmse = np.sqrt(np.mean((predictions - y.values) ** 2))
    print(f"  Training RMSE: Rs.{rmse:.0f}")
    print(f"  Avg predicted earnings: Rs.{predictions.mean():.0f}")

    joblib.dump(model, "models/earnings.pkl")
    print("  [OK] Saved: models/earnings.pkl")
    return model


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4.3 Fraud Detection Model (Isolation Forest)
# Detects anomalous behavior patterns
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_normal_behavior(n=1500):
    """Generate normal rider behavior — used to establish baseline."""
    np.random.seed(77)
    return pd.DataFrame({
        "idle_time_ratio": np.random.uniform(0.0, 0.3, n),
        "gps_jump_count": np.random.choice([0, 0, 0, 0, 1], n),
        "cancellation_rate": np.random.uniform(0, 0.2, n),
        "sensor_inactivity_ratio": np.random.uniform(0.0, 0.2, n),
        "avg_speed": np.random.uniform(15, 45, n),
        "shock_event_count": np.random.choice([0, 0, 0, 1], n),
    })


def train_fraud_model():
    print("\n" + "=" * 60)
    print("Training Fraud Model (Isolation Forest)...")
    print("=" * 60)

    df = generate_normal_behavior()
    feature_cols = [
        "idle_time_ratio", "gps_jump_count", "cancellation_rate",
        "sensor_inactivity_ratio", "avg_speed", "shock_event_count",
    ]
    X = df[feature_cols]

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,  # Assume ~5% of data is anomalous
        random_state=42,
    )
    model.fit(X)

    # Check what percentage are flagged as anomalies
    predictions = model.predict(X)
    anomaly_pct = (predictions == -1).sum() / len(predictions) * 100
    print(f"  Anomaly rate: {anomaly_pct:.1f}%")

    joblib.dump(model, "models/fraud.pkl")
    print("  [OK] Saved: models/fraud.pkl")
    return model


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main: Train all models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == "__main__":
    print("\nGigShield ML Model Training")
    print("=" * 60)

    train_risk_model()
    train_earnings_model()
    train_fraud_model()

    print("\n" + "=" * 60)
    print("[OK] All models trained successfully!")
    print("   models/risk.pkl      - XGBoost (disruption probability)")
    print("   models/earnings.pkl  - LightGBM (loss estimate)")
    print("   models/fraud.pkl     - IsolationForest (anomaly score)")
    print("=" * 60)
