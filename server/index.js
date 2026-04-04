import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import workerRoutes  from './routes/workerRoutes.js';
import triggerRoutes from './routes/triggerRoutes.js';
import claimRoutes   from './routes/claimRoutes.js';
import adminRoutes   from './routes/adminRoutes.js';
import authRoutes    from './routes/authRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/workers',  workerRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/claims',   claimRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/weather',  weatherRoutes);
app.use('/api/payments', paymentRoutes);

// ── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'GigShield API v2',
    timestamp: new Date().toISOString(),
    apis: {
      weather: process.env.OPENWEATHER_API_KEY ? 'LIVE (OpenWeatherMap)' : 'MOCK',
      payment: process.env.RAZORPAY_KEY_ID     ? 'LIVE (Razorpay)'       : 'TEST (Mock)',
      maps:    'LIVE (OpenStreetMap / Nominatim)',
    },
  });
});

// ── Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log('');
    console.log('  🛡️  GigShield API Server v2');
    console.log(`  ✅  Running on http://localhost:${PORT}`);
    console.log(`  🌤️  Weather :  ${process.env.OPENWEATHER_API_KEY ? 'Live (OpenWeatherMap)' : 'Mock mode'}`);
    console.log(`  💳  Payments:  ${process.env.RAZORPAY_KEY_ID     ? 'Razorpay Test Mode'    : 'Mock payout'}`);
    console.log(`  🗺️   Maps    :  OpenStreetMap / Leaflet (free)`);
    console.log('');
  });
};

startServer();
