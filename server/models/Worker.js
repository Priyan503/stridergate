import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  // ── Existing fields ─────────────────────────────────────────────
  workerId:  { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  city:      { type: String, required: true },
  zone:      { type: String, required: true },
  pincode:   { type: String },
  platform:  { type: String, required: true, enum: ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Amazon Flex', 'Ola', 'Uber', 'Rapido'] },
  earnings:  { type: Number, required: true },
  plan:      { type: String, enum: ['Basic', 'Standard', 'Max'], default: 'Standard' },
  premium:   { type: Number, default: 0 },
  bcs:       { type: Number, default: 75, min: 0, max: 100 },
  status:    { type: String, enum: ['active', 'flagged', 'suspended'], default: 'active' },
  claims:    { type: Number, default: 0 },
  joined:    { type: Date, default: Date.now },

  // ── New fields for ML pipeline ──────────────────────────────────
  phone:               { type: String },
  device_id:           { type: String },
  risk_zone_score:     { type: Number, default: 0.5, min: 0, max: 1 },

  // Subscription management
  insurance_active:    { type: Boolean, default: false },
  subscription_start:  { type: Date },
  subscription_end:    { type: Date },
  subscription_id:     { type: String },         // Razorpay subscription ID
  premium_amount:      { type: Number },         // Weekly premium in INR (dynamically priced)

  // Fraud & trust scoring
  spoofing_score:      { type: Number, default: 0, min: 0, max: 100 },
  trust_score:         { type: Number, default: 75, min: 0, max: 100 },
  trust_level:         { type: String, enum: ['new', 'trusted', 'flagged'], default: 'new' },

  // Claim tracking
  total_claims:        { type: Number, default: 0 },
  approved_claims:     { type: Number, default: 0 },

  // Location (for map display)
  lat:                 { type: Number },
  lng:                 { type: Number },
  verified:            { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Worker', workerSchema);
