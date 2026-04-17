import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  workerId:  { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  city:      { type: String, required: true },
  zone:      { type: String, required: true },
  pincode:   { type: String, required: true },
  platform:  { type: String, required: true, enum: ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Amazon Flex'] },
  earnings:  { type: Number, required: true },
  plan:      { type: String, required: true, enum: ['Basic', 'Standard', 'Max'], default: 'Standard' },
  premium:   { type: Number, default: 0 },
  bcs:       { type: Number, default: 75, min: 0, max: 100 },
  status:    { type: String, enum: ['active', 'flagged', 'suspended'], default: 'active' },
  claims:    { type: Number, default: 0 },
  joined:    { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Worker', workerSchema);
