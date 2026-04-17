import mongoose from 'mongoose';

const riderActivitySchema = new mongoose.Schema({
  rider_id:           { type: String, required: true },
  timestamp:          { type: Date, required: true },
  gps_lat:            { type: Number, required: true },
  gps_lng:            { type: Number, required: true },
  accuracy_meters:    { type: Number },           // Discard readings > 50m
  speed:              { type: Number },            // km/h
  heading:            { type: Number },            // degrees
  device_id:          { type: String },
  accelerometer:      { type: Number },
  gyro:               { type: Number },
  step_count:         { type: Number },
  network_type:       { type: String },
  ip_address:         { type: String },
  is_moving:          { type: Boolean },
  route_deviation_score: { type: Number },
  geo_fence_violation:   { type: Boolean, default: false },
});

riderActivitySchema.index({ rider_id: 1, timestamp: -1 });

export default mongoose.model('RiderActivity', riderActivitySchema);
