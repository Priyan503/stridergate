// ── In-memory store ──────────────────────────────────────────
const INITIAL_TRIGGERS = [
  { triggerId: 'T1', name: 'Heavy Rain', icon: '🌧️', source: 'OpenWeatherMap', threshold: 'Rainfall > 25mm / 3hr', current: '31.2mm', unit: 'mm/3hr', value: 31.2, limit: 25, fired: true, color: '#60a5fa' },
  { triggerId: 'T2', name: 'Extreme Heat', icon: '🌡️', source: 'OpenWeatherMap', threshold: 'Temp > 43°C', current: '38.4°C', unit: '°C', value: 38.4, limit: 43, fired: false, color: '#f97316' },
  { triggerId: 'T3', name: 'Severe AQI', icon: '💨', source: 'OpenAQ', threshold: 'AQI > 400', current: '287', unit: 'AQI', value: 287, limit: 400, fired: false, color: '#a78bfa' },
  { triggerId: 'T4', name: 'Local Curfew', icon: '🚧', source: 'NewsAPI', threshold: 'Zone flagged', current: 'Clear', unit: '', value: 0, limit: 1, fired: false, color: '#f59e0b' },
  { triggerId: 'T5', name: 'Platform Outage', icon: '📵', source: 'Mock Platform API', threshold: 'Downtime > 2hr', current: 'Operational', unit: '', value: 0, limit: 1, fired: false, color: '#e05c5c' },
];

let triggers = JSON.parse(JSON.stringify(INITIAL_TRIGGERS));

// GET /api/triggers
export const getTriggers = (req, res) => {
  res.json({ success: true, data: triggers });
};

// POST /api/triggers/:id/simulate — Fire a trigger
export const simulateTrigger = (req, res) => {
  const { id } = req.params;
  const trigger = triggers.find(t => t.triggerId === id);

  if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });

  trigger.fired = true;
  trigger.firedAt = new Date();

  if (id === 'T1') trigger.current = '41.8mm';
  else if (id === 'T3') trigger.current = '423';
  else trigger.current = 'Active';

  res.json({ success: true, data: trigger, message: `${trigger.name} trigger fired! Auto-claims initiated.` });
};

// POST /api/triggers/:id/reset — Reset a trigger
export const resetTrigger = (req, res) => {
  const { id } = req.params;
  const original = INITIAL_TRIGGERS.find(t => t.triggerId === id);

  if (!original) return res.status(404).json({ success: false, error: 'Trigger not found' });

  triggers = triggers.map(t => t.triggerId === id ? JSON.parse(JSON.stringify(original)) : t);

  res.json({ success: true, data: triggers.find(t => t.triggerId === id) });
};
