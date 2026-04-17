import express from 'express';
import { runFraudAnalysis, getPredictiveForecast } from '../controllers/mlController.js';

const router = express.router || express.Router();

// Run generative AI / ML assessment for anomalous claim behavior
router.post('/analyze-fraud', runFraudAnalysis);

// Fetch generative predictive insights on next week's risks
router.get('/predictive-forecast', getPredictiveForecast);

export default router;
