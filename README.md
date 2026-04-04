
# 🛡️ Shielded Rider

### AI-Powered Monsoon Income Protection for Delivery Riders

---

##  Overview

**Shielded Rider** is a smart, automated parametric insurance system designed for two-wheeler delivery riders affected by monsoon disruptions.

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

1. Rider subscribes to a weekly plan
    
2. System collects:
    
    - Location data
        
    - Delivery activity
        
    - Weather data
        
3. Risk model predicts disruption
    
4. Earnings model estimates expected income
    
5. Fraud engine validates claim
    
6. Payout is triggered automatically
    

---

##  AI/ML Architecture

### 1. Risk Prediction Model

- Model: XGBoost
    
- Predicts probability of disruption
    
- Inputs:
    
    - Rainfall
        
    - Flood data
        
    - Traffic conditions
        
**Output:**

```
P(disruption) ∈ [0,1]
```

### 2. Earnings Prediction Model

- Model: Random Forest
    
- Predicts expected daily income
    
- Inputs:
    
    - Historical earnings
        
    - Time & demand patterns
        
    - Weather
        

### 3. Fraud Detection Engine

- Model: Isolation Forest
    
- Detects anomalies and spoofing attempts
    

---

##  Anti-Fraud & Security System

### 🔹 Movement & Environmental Intelligence

- Matches rider movement with real traffic and weather conditions
    
- Detects unrealistic behavior
    

---

### 🔹 Cross-User Fraud Detection

- Identifies suspicious clusters of users with:
    
    - Same location
        
    - Same timestamps
        
    - Same inactivity
        

---

### 🔹 Active Movement Verification (Challenge-Response)

If GPS shows no movement during disruption:

- App prompts user to move ~100 meters
    
- Movement verified via:
    
    - Accelerometer
        
    - Gyroscope
        
    - GPS update
        

**If verified:** Claim proceeds  
**If not:**  
User is notified to check location services

 Prevents fake “idle but claiming loss” scenarios

---

### 🔹 Transparent Anomaly Resolution

Instead of silent rejection:

- System notifies users when anomalies are detected
    

**Example:**  
“Our system detected unusual device activity. Please reconnect or report the issue.”

**Benefits:**

- Builds trust
    
- Avoids unfair rejection
    
- Warns malicious users
    

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

Also considers:

- Local rainfall history
    
- Flood-prone zones
    
Risk Factor = (Local Rainfall History × Flood-Prone Zones)
```
ISS = (Avg Orders × Consistency × Rating × Active Hours × Risk Factor)
```

---

##  Policy Exclusions

No payouts in cases of:

- War or terrorism
    
- Government lockdowns
    
- Nuclear/biological events
    
- Proven fraud (GPS spoofing, tampering, account misuse)
    

---

##  Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React.js, Tailwind CSS           |
| Backend  | Node.js, Express                 |
| Database | MongoDB, Redis                   |
| AI/ML    | Python, Scikit-learn, XGBoost    |
| APIs     | OpenWeather, Google Maps, OpenAQ |
| Payments | Razorpay (Test Mode)             |

---
## API Integrations

- Weather API (OpenWeather)
- Google Maps API
- Razorpay (test mode)
- OpenAQ (pollution data)

---

## 🏗️
---

##  Impact

- Protects gig workers’ daily income
    
- Reduces financial uncertainty
    
- Builds trust with transparent systems
    
- Enables scalable, automated insurance
    

---

##  Future Scope

- Deep learning for advanced fraud detection
    
- Direct integration with Swiggy/Zomato APIs
    
- Hyperlocal flood prediction (500m grid)
    

---

## Final Thought

RainShield Rider is not just an insurance system.

It is a **financial safety net engineered for real-world gig workers**, combining AI, behavioral analysis, and actuarial thinking to deliver **fair, fast, and fraud-resistant protection**.

