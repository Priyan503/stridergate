import mongoose from 'mongoose';

const triggerSchema = new mongoose.Schema({
  triggerId:  { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  icon:       { type: String },
  source:     { type: String, required: true },
  threshold:  { type: String, required: true },
  current:    { type: String, default: '0' },
  unit:       { type: String, default: '' },
  value:      { type: Number, default: 0 },
  limit:      { type: Number, required: true },
  fired:      { type: Boolean, default: false },
  color:      { type: String, default: '#60a5fa' },
  firedAt:    { type: Date },
}, { timestamps: true });

export default mongoose.model('Trigger', triggerSchema);
