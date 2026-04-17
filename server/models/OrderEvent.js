import mongoose from 'mongoose';

const orderEventSchema = new mongoose.Schema({
  order_id:    { type: String, required: true, unique: true },
  rider_id:    { type: String, required: true },
  pickup_time: { type: Date },
  drop_time:   { type: Date },
  status:      { type: String, enum: ['completed', 'cancelled', 'pending', 'rejected'], default: 'pending' },
  distance_km: { type: Number },
  earnings:    { type: Number },
  cancellation_reason: { type: String },
}, { timestamps: true });

orderEventSchema.index({ rider_id: 1, pickup_time: -1 });

export default mongoose.model('OrderEvent', orderEventSchema);
