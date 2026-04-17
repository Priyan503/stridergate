/**
 * MongoDB Seed Script — Populates the database with demo data.
 * Run: node scripts/seed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Worker from '../models/Worker.js';
import Claim from '../models/Claim.js';
import Trigger from '../models/Trigger.js';
import RiderActivity from '../models/RiderActivity.js';
import OrderEvent from '../models/OrderEvent.js';
import SensorData from '../models/SensorData.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shieldedrider';

// ── Demo Workers ──────────────────────────────────────────────────
const WORKERS = [
  { workerId: 'W001', name: 'Ravi Kumar',   city: 'Bengaluru', zone: 'Koramangala',   pincode: '560034', platform: 'Swiggy',  earnings: 4200, plan: 'Standard', premium: 67,  premium_amount: 78,  bcs: 82, trust_score: 82, trust_level: 'trusted', spoofing_score: 5,  risk_zone_score: 0.75, status: 'active',  insurance_active: true, verified: true,  lat: 12.9352, lng: 77.6245 },
  { workerId: 'W002', name: 'Priya Sharma', city: 'Chennai',   zone: 'Anna Nagar',    pincode: '600040', platform: 'Zomato',  earnings: 3800, plan: 'Basic',    premium: 44,  premium_amount: 56,  bcs: 91, trust_score: 91, trust_level: 'trusted', spoofing_score: 0,  risk_zone_score: 0.40, status: 'active',  insurance_active: true, verified: true,  lat: 13.0827, lng: 80.2187 },
  { workerId: 'W003', name: 'Arjun Mehta',  city: 'Mumbai',    zone: 'Andheri East',  pincode: '400069', platform: 'Swiggy',  earnings: 5100, plan: 'Max',      premium: 96,  premium_amount: 112, bcs: 34, trust_score: 34, trust_level: 'flagged', spoofing_score: 65, risk_zone_score: 0.80, status: 'flagged', insurance_active: true, verified: false, lat: 19.1136, lng: 72.8697 },
  { workerId: 'W004', name: 'Deepa Nair',   city: 'Hyderabad', zone: 'Banjara Hills', pincode: '500034', platform: 'Zomato',  earnings: 3500, plan: 'Basic',    premium: 41,  premium_amount: 52,  bcs: 74, trust_score: 74, trust_level: 'trusted', spoofing_score: 10, risk_zone_score: 0.55, status: 'active',  insurance_active: true, verified: true,  lat: 17.4123, lng: 78.4480 },
];

// ── Demo Claims ───────────────────────────────────────────────────
const CLAIMS = [
  { claimId: 'CLM-0042', worker: 'Ravi Kumar',  workerId: 'W001', zone: 'Koramangala',   trigger: 'Heavy Rain',  claim_type: 'heavy_rain', amount: 280, status: 'paid',    final_decision: 'approve',       bcs: 82, risk_score: 0.72, anomaly_score: 0.12, estimated_loss: 420, llm_decision: 'approve',       llm_reason: 'Low fraud signals. Weather data confirms heavy rainfall in zone.', time: '14:32', date: 'Apr 3',  weather_snapshot: { condition: 'Heavy Rain', rainfall_mm: 34.2, wind_speed: 14, aqi: 120, data_source: 'mock' } },
  { claimId: 'CLM-0041', worker: 'Deepa Nair',  workerId: 'W004', zone: 'Banjara Hills', trigger: 'Heavy Rain',  claim_type: 'rain',       amount: 210, status: 'paid',    final_decision: 'approve',       bcs: 74, risk_score: 0.55, anomaly_score: 0.18, estimated_loss: 310, llm_decision: 'approve',       llm_reason: 'Consistent activity pattern. Weather data supports claim.', time: '11:20', date: 'Apr 3',  weather_snapshot: { condition: 'Light Rain', rainfall_mm: 18.5, wind_speed: 10, aqi: 140, data_source: 'mock' } },
  { claimId: 'CLM-0040', worker: 'Arjun Mehta', workerId: 'W003', zone: 'Andheri East',  trigger: 'Heavy Rain',  claim_type: 'heavy_rain', amount: 380, status: 'flagged', final_decision: 'manual_review', bcs: 34, risk_score: 0.81, anomaly_score: 0.68, estimated_loss: 560, llm_decision: 'manual_review', llm_reason: 'GPS anomaly detected — 3 jumps in 30 minutes. Sensor shows no movement.', llm_top_flags: ['gps_jump', 'sensor_inactivity'], time: '09:15', date: 'Apr 2',  weather_snapshot: { condition: 'Heavy Rain', rainfall_mm: 45.0, wind_speed: 22, aqi: 180, data_source: 'mock' }, adminNote: 'GPS anomaly detected' },
  { claimId: 'CLM-0039', worker: 'Ravi Kumar',  workerId: 'W001', zone: 'Koramangala',   trigger: 'Severe AQI',  claim_type: 'pollution',  amount: 180, status: 'paid',    final_decision: 'approve',       bcs: 88, risk_score: 0.35, anomaly_score: 0.08, estimated_loss: 250, llm_decision: 'skip',          llm_reason: 'LLM skipped — low risk.', time: '16:50', date: 'Mar 28', weather_snapshot: { condition: 'Hazy', rainfall_mm: 0, wind_speed: 5, aqi: 340, data_source: 'mock' } },
  { claimId: 'CLM-0038', worker: 'Arjun Mehta', workerId: 'W003', zone: 'Andheri East',  trigger: 'Heavy Rain',  claim_type: 'heavy_rain', amount: 380, status: 'rejected',final_decision: 'reject',        bcs: 28, risk_score: 0.92, anomaly_score: 0.88, estimated_loss: 0,   llm_decision: 'reject',        llm_reason: 'Multiple independent fraud signals: GPS spoofing pattern, no sensor movement, high cancellation rate.', llm_top_flags: ['gps_spoofing', 'sensor_inactivity', 'high_cancellation'], time: '08:00', date: 'Mar 25', weather_snapshot: { condition: 'Heavy Rain', rainfall_mm: 38.0, wind_speed: 18, aqi: 150, data_source: 'mock' }, adminNote: 'Fraud pattern confirmed' },
];

// ── Demo Triggers ─────────────────────────────────────────────────
const TRIGGERS = [
  { triggerId: 'T1', name: 'Heavy Rain',      icon: '🌧️', source: 'OpenWeatherMap',    threshold: 'Rainfall > 25mm / 3hr', current: '31.2mm',      unit: 'mm/3hr', value: 31.2, limit: 25,  fired: true,  color: '#60a5fa' },
  { triggerId: 'T2', name: 'Extreme Heat',     icon: '🌡️', source: 'OpenWeatherMap',    threshold: 'Temp > 43°C',           current: '38.4°C',      unit: '°C',     value: 38.4, limit: 43,  fired: false, color: '#f97316' },
  { triggerId: 'T3', name: 'Severe AQI',       icon: '💨', source: 'OpenAQ',             threshold: 'AQI > 400',             current: '287',         unit: 'AQI',    value: 287,  limit: 400, fired: false, color: '#a78bfa' },
  { triggerId: 'T4', name: 'Local Curfew',     icon: '🚧', source: 'NewsAPI',             threshold: 'Zone flagged',          current: 'Clear',       unit: '',       value: 0,    limit: 1,   fired: false, color: '#f59e0b' },
  { triggerId: 'T5', name: 'Platform Outage',  icon: '📵', source: 'Mock Platform API',   threshold: 'Downtime > 2hr',        current: 'Operational', unit: '',       value: 0,    limit: 1,   fired: false, color: '#e05c5c' },
];

// ── Sample Activity Data (for W001) ───────────────────────────────
function generateActivityData(riderId, lat, lng, count = 20) {
  const records = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    records.push({
      rider_id: riderId,
      timestamp: new Date(now - i * 5 * 60 * 1000),
      gps_lat: lat + (Math.random() - 0.5) * 0.01,
      gps_lng: lng + (Math.random() - 0.5) * 0.01,
      accuracy_meters: Math.random() * 30,
      speed: 10 + Math.random() * 30,
      heading: Math.random() * 360,
      device_id: `DEV-${riderId}`,
      accelerometer: 0.3 + Math.random() * 2,
      gyro: Math.random() * 0.5,
      step_count: Math.floor(Math.random() * 100),
      is_moving: true,
    });
  }
  return records;
}

function generateOrderData(riderId, count = 15) {
  const records = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    records.push({
      order_id: `ORD-${riderId}-${String(i).padStart(3, '0')}`,
      rider_id: riderId,
      pickup_time: new Date(now - i * 3 * 60 * 60 * 1000),
      drop_time: new Date(now - i * 3 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: Math.random() > 0.15 ? 'completed' : 'cancelled',
      distance_km: 2 + Math.random() * 8,
      earnings: 30 + Math.random() * 70,
    });
  }
  return records;
}

function generateSensorData(riderId, count = 15) {
  const records = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    records.push({
      rider_id: riderId,
      timestamp: new Date(now - i * 5 * 60 * 1000),
      acceleration: 0.5 + Math.random() * 3,
      gyro: Math.random() * 1.5,
      shock_event: Math.random() > 0.95,
      step_count: Math.floor(Math.random() * 50),
    });
  }
  return records;
}

// ── Main Seed ─────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('  📦 Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Worker.deleteMany({}),
      Claim.deleteMany({}),
      Trigger.deleteMany({}),
      RiderActivity.deleteMany({}),
      OrderEvent.deleteMany({}),
      SensorData.deleteMany({}),
    ]);
    console.log('  🗑️  Cleared existing data');

    // Seed workers
    await Worker.insertMany(WORKERS);
    console.log(`  👷 Seeded ${WORKERS.length} workers`);

    // Seed claims
    await Claim.insertMany(CLAIMS);
    console.log(`  📋 Seeded ${CLAIMS.length} claims`);

    // Seed triggers
    await Trigger.insertMany(TRIGGERS);
    console.log(`  ⚡ Seeded ${TRIGGERS.length} triggers`);

    // Seed activity data for each worker
    for (const w of WORKERS) {
      const activities = generateActivityData(w.workerId, w.lat, w.lng);
      const orders = generateOrderData(w.workerId);
      const sensors = generateSensorData(w.workerId);

      await RiderActivity.insertMany(activities);
      await OrderEvent.insertMany(orders);
      await SensorData.insertMany(sensors);
    }
    console.log('  📊 Seeded activity, order, and sensor data for all workers');

    console.log('\n  ✅ Seed complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('  ❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
