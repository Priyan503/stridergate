import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  claimId:   { type: String, required: true, unique: true },
  worker:    { type: String, required: true },
  zone:      { type: String, required: true },
  trigger:   { type: String, required: true },
  amount:    { type: Number, required: true },
  status:    { type: String, enum: ['paid', 'flagged', 'rejected', 'pending'], default: 'pending' },
  bcs:       { type: Number, default: 0 },
  time:      { type: String },
  date:      { type: String },
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);
