"""
Feature Engineering Pipeline
Converts raw GPS, order, sensor, and weather data into ML-ready signals.
Runs inside the ML service before every prediction.
"""

import pandas as pd
import numpy as np
from geopy.distance import geodesic


def compute_gps_features(activity_df: pd.DataFrame) -> dict:
    """
    Input: DataFrame of rider_activity rows for a time window.
    Output: Dictionary of GPS-derived features.
    """
    if activity_df.empty or len(activity_df) < 2:
        return {
            "avg_speed": 0.0,
            "speed_std": 0.0,
            "idle_time_ratio": 1.0,
            "gps_jump_count": 0,
        }

    # Filter out low-accuracy readings
    df = activity_df.copy()
    if "accuracy_meters" in df.columns:
        df = df[df["accuracy_meters"] < 50].copy()

    if df.empty or len(df) < 2:
        return {
            "avg_speed": 0.0,
            "speed_std": 0.0,
            "idle_time_ratio": 1.0,
            "gps_jump_count": 0,
        }

    # Speed anomaly: deviation from expected speed for zone
    avg_speed = float(df["speed"].mean()) if "speed" in df.columns else 0.0
    speed_std = float(df["speed"].std()) if "speed" in df.columns else 0.0

    # Idle time ratio: % of time with speed < 2 km/h
    idle_ratio = float((df["speed"] < 2).sum() / len(df)) if "speed" in df.columns else 1.0

    # Teleportation detection: sudden jumps > 500m between consecutive readings
    jump_events = 0
    if "gps_lat" in df.columns and "gps_lng" in df.columns:
        df = df.sort_values("timestamp") if "timestamp" in df.columns else df
        coords = list(zip(df["gps_lat"], df["gps_lng"]))
        for i in range(1, len(coords)):
            try:
                dist = geodesic(coords[i - 1], coords[i]).meters
                if "timestamp" in df.columns:
                    time_diff = (
                        pd.to_datetime(df["timestamp"].iloc[i])
                        - pd.to_datetime(df["timestamp"].iloc[i - 1])
                    ).seconds
                    if dist > 500 and time_diff < 60:
                        jump_events += 1
                elif dist > 500:
                    jump_events += 1
            except Exception:
                continue

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
    if orders_df.empty:
        return {
            "cancellation_rate": 0.0,
            "avg_daily_orders": 0.0,
            "avg_earnings_per_order": 0.0,
            "total_orders_window": 0,
        }

    total = len(orders_df)
    cancelled = (orders_df["status"] == "cancelled").sum() if "status" in orders_df.columns else 0

    cancellation_rate = float(cancelled / total) if total > 0 else 0.0
    avg_earnings = float(orders_df["earnings"].mean()) if "earnings" in orders_df.columns and total > 0 else 0.0
    orders_per_day = float(total / window_days)

    return {
        "cancellation_rate": cancellation_rate,
        "avg_daily_orders": orders_per_day,
        "avg_earnings_per_order": avg_earnings,
        "total_orders_window": int(total),
    }


def compute_sensor_features(sensor_df: pd.DataFrame) -> dict:
    """
    Input: DataFrame of sensor_data rows.
    Output: Sensor-derived features.
    """
    if sensor_df.empty:
        return {
            "shock_event_count": 0,
            "avg_acceleration": 0.0,
            "sensor_inactivity_ratio": 1.0,  # No data = suspicious
        }

    shock_events = int(sensor_df["shock_event"].sum()) if "shock_event" in sensor_df.columns else 0
    avg_acceleration = float(sensor_df["acceleration"].mean()) if "acceleration" in sensor_df.columns else 0.0
    inactivity_ratio = (
        float((sensor_df["acceleration"] < 0.1).sum() / len(sensor_df))
        if "acceleration" in sensor_df.columns
        else 1.0
    )

    return {
        "shock_event_count": shock_events,
        "avg_acceleration": avg_acceleration,
        "sensor_inactivity_ratio": inactivity_ratio,
    }


def compute_environmental_features(weather_snapshot: dict, traffic_snapshot: dict) -> dict:
    """
    Input: Weather and traffic API snapshots at claim time.
    Output: Environmental signals for fraud matching.
    """
    rain_intensity = 0.0
    if isinstance(weather_snapshot.get("rain"), dict):
        rain_intensity = weather_snapshot["rain"].get("1h", 0)
    elif "rainfall" in weather_snapshot:
        rain_intensity = weather_snapshot.get("rainfall", 0)

    aqi = weather_snapshot.get("aqi", 0)
    wind_speed = 0.0
    if isinstance(weather_snapshot.get("wind"), dict):
        wind_speed = weather_snapshot["wind"].get("speed", 0)
    elif "wind_speed" in weather_snapshot:
        wind_speed = weather_snapshot.get("wind_speed", 0)

    traffic_duration = traffic_snapshot.get("duration_in_traffic", 1) if traffic_snapshot else 1
    traffic_normal = max(traffic_snapshot.get("duration", 1) if traffic_snapshot else 1, 1)
    traffic_congestion_ratio = float(traffic_duration / traffic_normal)

    return {
        "rain_intensity_mm": float(rain_intensity),
        "aqi": float(aqi),
        "wind_speed": float(wind_speed),
        "traffic_congestion_ratio": traffic_congestion_ratio,
    }


def build_feature_vector(gps_feats: dict, behavior_feats: dict, sensor_feats: dict, env_feats: dict) -> dict:
    """Merge all feature groups into a single flat vector for model input."""
    return {
        **gps_feats,
        **behavior_feats,
        **sensor_feats,
        **env_feats,
    }
