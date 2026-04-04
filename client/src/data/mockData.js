// ── Mock Workers ──────────────────────────────────────────────
export const WORKERS = [
  { id: 'W001', name: 'Ravi Kumar', city: 'Bengaluru', zone: 'Koramangala', pincode: '560034', platform: 'Swiggy', earnings: 4200, plan: 'Standard', premium: 67, bcs: 82, status: 'active', claims: 2, joined: '2026-02-10' },
  { id: 'W002', name: 'Priya Sharma', city: 'Chennai', zone: 'Anna Nagar', pincode: '600040', platform: 'Zomato', earnings: 3800, plan: 'Basic', premium: 44, bcs: 91, status: 'active', claims: 0, joined: '2026-01-28' },
  { id: 'W003', name: 'Arjun Mehta', city: 'Mumbai', zone: 'Andheri East', pincode: '400069', platform: 'Swiggy', earnings: 5100, plan: 'Max', premium: 96, bcs: 34, status: 'flagged', claims: 5, joined: '2026-01-15' },
  { id: 'W004', name: 'Deepa Nair', city: 'Hyderabad', zone: 'Banjara Hills', pincode: '500034', platform: 'Zomato', earnings: 3500, plan: 'Basic', premium: 41, bcs: 74, status: 'active', claims: 1, joined: '2026-02-20' },
];

// ── Mock Triggers ─────────────────────────────────────────────
export const TRIGGERS = [
  { id: 'T1', name: 'Heavy Rain', icon: '🌧️', source: 'OpenWeatherMap', threshold: 'Rainfall > 25mm / 3hr', current: '31.2mm', unit: 'mm/3hr', value: 31.2, limit: 25, fired: true, color: '#60a5fa' },
  { id: 'T2', name: 'Extreme Heat', icon: '🌡️', source: 'OpenWeatherMap', threshold: 'Temp > 43°C', current: '38.4°C', unit: '°C', value: 38.4, limit: 43, fired: false, color: '#f97316' },
  { id: 'T3', name: 'Severe AQI', icon: '💨', source: 'OpenAQ', threshold: 'AQI > 400', current: '287', unit: 'AQI', value: 287, limit: 400, fired: false, color: '#a78bfa' },
  { id: 'T4', name: 'Local Curfew', icon: '🚧', source: 'NewsAPI', threshold: 'Zone flagged', current: 'Clear', unit: '', value: 0, limit: 1, fired: false, color: '#f59e0b' },
  { id: 'T5', name: 'Platform Outage', icon: '📵', source: 'Mock Platform API', threshold: 'Downtime > 2hr', current: 'Operational', unit: '', value: 0, limit: 1, fired: false, color: '#e05c5c' },
];

// ── Mock Claims ───────────────────────────────────────────────
export const CLAIMS = [
  { id: 'CLM-0042', worker: 'Ravi Kumar', zone: 'Koramangala', trigger: 'Heavy Rain', amount: 280, status: 'paid', bcs: 82, time: '14:32', date: 'Mar 18' },
  { id: 'CLM-0041', worker: 'Deepa Nair', zone: 'Banjara Hills', trigger: 'Heavy Rain', amount: 210, status: 'paid', bcs: 74, time: '11:20', date: 'Mar 18' },
  { id: 'CLM-0040', worker: 'Arjun Mehta', zone: 'Andheri East', trigger: 'Heavy Rain', amount: 380, status: 'flagged', bcs: 34, time: '09:15', date: 'Mar 17' },
  { id: 'CLM-0039', worker: 'Ravi Kumar', zone: 'Koramangala', trigger: 'Severe AQI', amount: 180, status: 'paid', bcs: 88, time: '16:50', date: 'Mar 12' },
  { id: 'CLM-0038', worker: 'Arjun Mehta', zone: 'Andheri East', trigger: 'Heavy Rain', amount: 380, status: 'rejected', bcs: 28, time: '08:00', date: 'Mar 10' },
];

// ── Chart Data ────────────────────────────────────────────────
export const WEEKLY_DATA = [62, 48, 85, 91, 73, 67, 88];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
