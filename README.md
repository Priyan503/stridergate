# 🛡️ Shielded Rider

### AI-Powered Monsoon Income Protection for Delivery Riders

---

##  Overview

**Shielded Rider** is a smart, automated parametric insurance system Proof-of-Concept (PoC) designed for two-wheeler delivery riders affected by monsoon disruptions.

Instead of manual claims and delayed payouts, our system:
- Predicts income loss
- Verifies real-world conditions
- Automatically compensates riders

---

##  Problem

Delivery riders in Indian cities face:
- Heavy rainfall and flooding
- Unsafe road conditions
- Reduced order volume

This leads to **20–40% income loss**, while traditional insurance:
- Is slow
- Requires manual claims
- Doesn’t cover daily earnings

---

## Core Idea

- Predicts income disruption risk
- Tracks real-world conditions
- Estimates expected earnings
- Automatically compensates workers

No claims. No paperwork. Fully automated.

### Key Innovation: Earnings Shadow Model

We don’t just detect rain — we calculate **actual income loss**.

**How it works:**
- Predict expected earnings
- Compare with actual earnings
- Trigger proportional payout

**Example:**
- Expected: ₹800
- Actual: ₹400
- Compensation: ₹400

---
### Why This Matters

- Moves beyond **event-based triggers → income-based protection**
- Introduces **real insurance logic (actuarial depth)**
- Personalized per worker

---

##  System Workflow

1. Rider subscribes to a weekly plan.
2. System collects location, delivery, and active event data.
3. Risk model predicts disruption and visualizes it via the **AI Predictive Analytics (Admin Dashboard)**.
4. Earnings model estimates expected income.
5. **Agentic Fraud Engine** layer-checks telemetry to validate the claim.
6. The rider's **Intelligent Dashboard: Earnings Protected** displays active coverage, and the **Instant Mock Payout System** triggers the payout to UPI automatically.

---

##  AI/ML Architecture

### Current Implementation: Generative Offline Simulation
To ensure maximum stability for demonstration purposes (avoiding hard API quotas or model timeouts), this repository implements a custom **Node.js Offline Generative AI Mock Service**. It realistically simulates complex geospatial data evaluation and telemetry reasoning (e.g. anti-spoofing logic) to provide instantaneous dashboard insights and fraud assessments without requiring external API keys.

### Proposed Live Architecture:
When completely scaled, the structural architecture relies on:

**1. Risk Prediction Model**
- **Model:** XGBoost
- **Predicts:** Probability of disruption
- **Inputs:** Rainfall, Flood data, Traffic conditions
- **Output:** `P(disruption) ∈ [0,1]`

**2. Earnings Prediction Model**
- **Model:** Random Forest
- **Predicts:** Expected daily income
- **Inputs:** Historical earnings, Time & demand patterns, Weather

**3. Fraud Detection Engine**
- **Model:** Isolation Forest
- **Detects:** Anomalies and spoofing attempts

---

##  Anti-Fraud & Security System

### 🔹 Movement & Environmental Intelligence
- Matches rider movement with real traffic and weather conditions.
- Detects static behavior claiming to be active.

### 🔹 Cross-User Fraud Detection
- Identifies suspicious clusters of users with same location, timestamps, and inactivity.

### 🔹 Active Movement Verification (Challenge-Response)
If GPS shows no movement during disruption:
- App prompts user to move ~100 meters.
- Movement verified via GPS and simulated gyroscope.
**If verified:** Auto-Approved by AI, and triggers ⚡ Instant payout routed to Mock UPI.
**If not:** System outputs "Claim Held / GPS Spoofing - Location confirmation requested". Prevents fake “idle but claiming loss” scenarios.

### 🔹 Transparent Anomaly Resolution
Instead of silent rejection, the system generates real-time explanations analyzing GPS drift, fraud rings, and sensor profiles for the Administrator dashboard.

---

##  Dynamic Pricing Model

### Income Stability Score (ISS)

Premiums are personalized based on:
- Order consistency
- Ratings
- Active hours
- Work patterns

**High ISS → Lower premium**  
**Low ISS → Adjusted premium**

Risk Factor = (Local Rainfall History × Flood-Prone Zones)
```
ISS = (Avg Orders × Consistency × Rating × Active Hours × Risk Factor)
```

---

##  Tech Stack (Proof-of-Concept)

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React.js, Vanilla CSS (Custom)   |
| Backend  | Node.js, Express                 |
| Database | In-Memory JSON (for sandbox)     |
| AI/ML    | Custom Offline AI Simulation API |
| Payments | Razorpay Mock Payout Service     |

---

## API Integrations

- **Mock UI Triggers:** OpenWeather / OpenAQ equivalents simulated
- **Maps:** Leaflet Integration
- **Payments:** Instant Offline Razorpay Simulator

---

##  Impact

- Protects gig workers’ daily income against severe conditions.
- Reduces financial uncertainty by operating transparently.
- Serves as an extremely resilient, scale-ready Offline Framework.

---

##  Future Scope

- Swap the simulated Generative AI layer for hardcoded Deep Learning models.
- Direct integration with Swiggy/Zomato APIs.
- Migration to persistent MongoDB indexing.
- Hyperlocal flood prediction (500m grid).

---

## Final Thought

Shielded Rider is not just an insurance system.

It is a **financial safety net engineered for real-world gig workers**, combining smart offline AI simulations, behavioral analysis, and actuarial thinking to deliver **fair, fast, and fraud-resistant protection**.
