import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  rider_id:     { type: String, required: true },
  timestamp:    { type: Date, required: true },
  acceleration: { type: Number },
  gyro:         { type: Number },
  shock_event:  { type: Boolean, default: false },
  step_count:   { type: Number },
  device_inactivity_minutes: { type: Number },
}, { timestamps: true });

sensorDataSchema.index({ rider_id: 1, timestamp: -1 });

export default mongoose.model('SensorData', sensorDataSchema);
