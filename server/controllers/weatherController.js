/**
 * Weather Controller — Live weather + trigger threshold checking
 */

import { getWeatherByCity, checkAllZoneTriggers } from '../services/weatherService.js';

const MONITORED_ZONES = [
  { name: 'Koramangala', city: 'Bengaluru'  },
  { name: 'Andheri East', city: 'Mumbai'    },
  { name: 'Anna Nagar',  city: 'Chennai'    },
  { name: 'Banjara Hills', city: 'Hyderabad'},
];

// GET /api/weather/:city
export const getWeather = async (req, res) => {
  try {
    const city    = decodeURIComponent(req.params.city);
    const weather = await getWeatherByCity(city);
    res.json({ success: true, data: { city, ...weather } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/weather/check-triggers — scan all zones
export const checkTriggers = async (req, res) => {
  try {
    const results = await checkAllZoneTriggers(MONITORED_ZONES);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
