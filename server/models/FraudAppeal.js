import mongoose from 'mongoose';

const fraudAppealSchema = new mongoose.Schema({
  appeal_id:         { type: String, required: true, unique: true },
  claim_id:          { type: String, required: true },
  rider_id:          { type: String, required: true },
  submitted_at:      { type: Date, default: Date.now },
  evidence_text:     { type: String },
  evidence_image_url:{ type: String },
  reviewer_decision: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
  reviewer_notes:    { type: String },
  resolved_at:       { type: Date },
}, { timestamps: true });

fraudAppealSchema.index({ claim_id: 1 });
fraudAppealSchema.index({ rider_id: 1 });

export default mongoose.model('FraudAppeal', fraudAppealSchema);
