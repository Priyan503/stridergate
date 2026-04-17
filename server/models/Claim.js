import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  // ── Core claim fields ───────────────────────────────────────────
  claimId:         { type: String, required: true, unique: true },
  worker:          { type: String, required: true },       // Worker name
  workerId:        { type: String },                       // Worker ID reference
  zone:            { type: String, required: true },
  trigger:         { type: String, required: true },       // Display trigger name

  // ── Claim details ──────────────────────────────────────────────
  claim_type:      { type: String, enum: ['rain', 'flood', 'curfew', 'pollution', 'accident', 'heavy_rain', 'extreme_rain', 'severe_aqi', 'high_aqi', 'extreme_heat', 'outage', 'disruption'] },
  claim_time:      { type: Date, default: Date.now },
  reported_issue:  { type: String },

  // ── Environmental snapshots at claim time ──────────────────────
  weather_snapshot: {
    condition:     { type: String },
    rainfall_mm:   { type: Number },
    wind_speed:    { type: Number },
    aqi:           { type: Number },
    temperature:   { type: Number },
    data_source:   { type: String },
  },
  traffic_snapshot: { type: mongoose.Schema.Types.Mixed },
  gps_at_claim:    {
    lat:           { type: Number },
    lng:           { type: Number },
  },

  // ── ML scores ──────────────────────────────────────────────────
  risk_score:          { type: Number },
  fraud_score:         { type: Number },
  anomaly_score:       { type: Number },
  estimated_loss:      { type: Number },           // From LightGBM earnings model
  spoofing_score_at_claim: { type: Number },

  // ── Full ML analysis pipeline ──────────────────────────────────
  ml_analysis: {
    risk_model:     { score: Number, features_used: [String], status: String },
    fraud_model:    { anomaly_score: Number, top_signals: [String], status: String },
    weather_check:  { mismatch: Boolean, actual_conditions: String, status: String },
    rule_engine:    { decision: String, reason: String },
    llm_reasoning:  { decision: String, reason: String, confidence: Number, top_flags: [String], llm_used: Boolean },
    feature_vector: { type: mongoose.Schema.Types.Mixed },
    independent_signal_count: Number,
    weather_mismatch: Boolean,
  },

  // ── Decisions ──────────────────────────────────────────────────
  status:          { type: String, enum: ['pending', 'paid', 'flagged', 'rejected', 'appealed', 'auto_approved', 'manual_review'], default: 'pending' },
  final_decision:  { type: String, enum: ['approve', 'manual_review', 'reject', 'verify', 'auto_approve'] },
  decision_reason: { type: String },
  llm_decision:    { type: String, enum: ['approve', 'manual_review', 'reject', 'skip'] },
  llm_reason:      { type: String },
  llm_confidence:  { type: Number },
  llm_top_flags:   [{ type: String }],

  // ── Payout ─────────────────────────────────────────────────────
  amount:              { type: Number },           // Payout amount in INR
  payout_transaction_id: { type: String },
  triggers_fired:      [{ type: String }],

  // ── Legacy compatibility ───────────────────────────────────────
  bcs:             { type: Number, default: 0 },
  time:            { type: String },
  date:            { type: String },
  adminNote:       { type: String },

  // ── Appeal system ──────────────────────────────────────────────
  appeal_submitted:  { type: Boolean, default: false },
  appeal_status:     { type: String, enum: ['none', 'pending', 'accepted', 'rejected'], default: 'none' },
}, { timestamps: true });

claimSchema.index({ workerId: 1, claim_time: -1 });
claimSchema.index({ status: 1 });

export default mongoose.model('Claim', claimSchema);
