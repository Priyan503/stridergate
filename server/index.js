import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import workerRoutes from './routes/workerRoutes.js';
import triggerRoutes from './routes/triggerRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/workers', workerRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GigShield API',
    timestamp: new Date().toISOString(),
  });
});

// ── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const startServer = async () => {
  // Attempt MongoDB connection (non-blocking — server runs even if DB fails)
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('  🛡️  GigShield API Server');
    console.log(`  ✅ Running on http://localhost:${PORT}`);
    console.log(`  📡 API endpoints at /api/*`);
    console.log('');
  });
};

startServer();
