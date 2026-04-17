import { analyzeFraud, generatePredictiveForecast } from '../services/mlService.js';

export const runFraudAnalysis = async (req, res) => {
  try {
    const { workerData } = req.body;
    if (!workerData) return res.status(400).json({ success: false, error: 'workerData required' });

    const result = await analyzeFraud(workerData);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPredictiveForecast = async (req, res) => {
  try {
    const forecast = await generatePredictiveForecast();
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
