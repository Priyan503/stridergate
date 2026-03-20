# AI-Powered Parametric Insurance for Gig Workers

##  Problem Statement

Gig workers (Swiggy, Zomato, Amazon delivery partners) often lose income due to external disruptions like heavy rain, floods, traffic shutdowns, or pollution. Currently, there is no reliable system to compensate them automatically.

This leads to **ineffecient insurence systems** and **financial instability**


##  Solution Overview

Our team have come up with an **AI-powered parametric insurance platform** that:
Monitors real-world conditions (weather, traffic, disruptions),Tracks worker activity and movement, Automatically triggers payments when conditions for income loss are encountered and Prevents fraudulent activities of the workers using advanced multi-layer detection mechanisms.

##  Target Users
The main target persona of this implementation includes Food delivery partners (Swiggy/Zomato),E-commerce deliveryworkers and drivers who provide on demand tarnsportation services, i.e Ride-hailing drivers (Ola/Uber/Rapido)

##  System Workflow and core concepts

1. Worker subscribes to a weekly insurance plan via mobile friendly web form (insurer-facing admin + worker-facing dashboard)
    
2. System continuously monitors:
    
    - Location
        
    - Activity
        
    - Environmental conditions

    and an AI model dynamically prices a weekly premium amount based on the historical risk factor of the area.

3. Parametric triggers monitor real-time weather + pollution + curfew signals
        
4. If disruption is detected or when a trigger is fired:
    
    - AI verifies legitimacy
        
    - Claim is processed automatically
        
5. Payout is credited (simulated)
  
6.A fraud engine cross-checks GPS activity logs, claim frequency, and weather data consistency 
    

##  Pricing Model

Dynamic weekly premium of the worker is based on:

- Area risk (flood-prone zones)
    
- Weather history
    
- Worker activity level

Prices allotted based on the risk factor associated with the area
    

##  AI/ML Components

### Risk Assessment- Predicts probability of disruption in a location - implementation of a 7 day weather-based claim probability based on the city zone
    

### Dynamic Pricing- Adjusts premium based on risk score (base premium changed based on the risk factor involved)
    

### Fraud Detection- Multi-layer behavioral + environmental verification system - flags if worker claims during weather that didn't occur in their GPS zone



#  Adversarial Defense & Anti-Spoofing Strategy

##  Core Idea: Reality Consistency Engine

We validate whether a user’s claim matches **real-world behavior, environmental conditions, and activity patterns**.

---
##  Spoofing Score System (Per User)

Each user is assigned a **Spoofing Score (0–100)** that represents the likelihood of fraudulent behavior.

###  Score Calculation Factors:

- Movement anomalies (teleportation, no motion)
    
- Lack of delivery activity during claim period
    
- Environmental mismatch (weather vs movement)
    
- Device anomalies (same device across accounts)
    
- Network inconsistencies (VPN/emulator signals)
    
- Sensor inactivity (no accelerometer/gyro data)

---

##  Layered Fraud Detection System

###  Layer 1: Movement Intelligence

- Continuous GPS tracking
    

Detect:

- Natural movement patterns (turns, stops, routes)
    
- Unrealistic teleportation (sudden jumps)
    

###  Layer 2: Work Behavior Matching

Check:

- Orders accepted
    
- Orders completed
    
- Time between deliveries
    
Real worker will always have consistent delivery patterns
    
Fake: -No order history during claim period
    

###  Layer 3: Environmental Matching (VERY POWERFUL)

Match user data with real-world conditions:

- Rain intensity vs movement speed
    
- Traffic congestion vs route time
    
- Area accessibility (flooded roads)
    

 Example:

- User claims flood
    
- But traffic API shows clear roads → suspicious
    

Layer 4: Cross-User Correlation (Fraud Ring Detection)

Detect coordinated fraud:

- Many users
    
- Same location
    
- Same time
    
- Same inactivity pattern
    

 This is not natural → indicates fraud ring

##  Routine Pattern Analysis (Behavioral Profiling)

We analyze **historical user behavior over time** to detect repeated fraud patterns.

###  What We Track:

- Daily working hours
    
- Typical delivery routes
    
- Average number of orders
    
- Movement consistency
    
- Claim timing patterns
    

## High-Signal Data Points Used

###  Device Intelligence

- Device ID / fingerprint
    
- OS version
    
- App version
    

used to detect the same device with multiple accounts


###  Network Data

- IP address consistency
    
- Network switching patterns
    
- Latency spikes
    

probits spoofers using VPNs


###  Sensor Data (VERY STRONG SIGNAL)

Use phone sensors:

- Accelerometer → detect movement
    
- Gyroscope → directional changes
    
- Step count
    

 Fake GPS:

- No real sensor activity
    

##  Escalation System

- Mild suspicion → delay payout
    
- Medium suspicion → additional verification
    
- High suspicion →  Claim flagged and User reported to special fraud review team
    

##  Goal

Catch fraud attempts **without hurting honest workers** (very imporatnt)


##  Smart Claim Handling

### Genuine Users

- Instant payout and No friction
    

### Suspicious Cases

- Delayed payout (not rejected) and Light verification required
  

### High-Risk Cases

- Claim held for deeper review and reported as fraudulant activity

    
##  Appeal System

- Users can retry verification
    
- Provide additional proof
    
- Prevent wrongful rejection
    

##  Trust-Based System

- Reliable users → faster approvals
    
- Suspicious history → stricter checks
    

## API Integrations

- Weather API (OpenWeather) - for weather triggers
    
- Maps API (Google Maps)
    
- Payment Gateway (Razorpay – test mode)
  
- OpenAQ API (free) — pollution/AQI triggers
    

##  Tech Stack

### Frontend

- React.js + Tailwind CSS
    

### Backend

- Node.js + Express
    

### Database

- MongoDB + Redis
    

### AI/ML

- Python (Scikit-learn) or rule-based system
- Pandas + NumPy


##  Key Features

- Automated claim triggering
    
- Real-time disruption detection
    
- Multi-layer fraud prevention
    
- Dynamic pricing
    
- Instant payout simulation
    

##  Future Scope

- Deep learning fraud models
    
- Real-time traffic intelligence
    
- Cross-platform integration (Swiggy/Zomato APIs)
    
- Personalized insurance plans
    



