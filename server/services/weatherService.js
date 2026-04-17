/**
 * Weather Service — OpenWeatherMap integration with mock fallback.
 * Enhanced with lat/lng-based fetching and parametric trigger evaluation.
 */

const API_KEY = process.env.OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ── Mock weather data per city ────────────────────────────────────
const MOCK_WEATHER = {
  Bengaluru:  { temp: 28, humidity: 82, wind: 14, rainfall: 34.2, desc: 'Heavy Rain', icon: '🌧️', condition: 'Rain',  aqi: 120 },
  Chennai:    { temp: 33, humidity: 76, wind: 18, rainfall: 8.1,  desc: 'Light Rain', icon: '🌦️', condition: 'Drizzle', aqi: 95 },
  Mumbai:     { temp: 31, humidity: 88, wind: 22, rainfall: 52.6, desc: 'Torrential Rain', icon: '⛈️', condition: 'Thunderstorm', aqi: 180 },
  Hyderabad:  { temp: 36, humidity: 64, wind: 10, rainfall: 2.4,  desc: 'Partly Cloudy', icon: '⛅', condition: 'Clouds', aqi: 140 },
  'Delhi NCR':{ temp: 38, humidity: 45, wind: 12, rainfall: 0,    desc: 'Clear Sky',    icon: '☀️', condition: 'Clear', aqi: 320 },
};
const DEFAULT_MOCK = { temp: 30, humidity: 70, wind: 12, rainfall: 5.0, desc: 'Partly Cloudy', icon: '⛅', condition: 'Clouds', aqi: 100 };

// ── Trigger thresholds (from guide §8) ────────────────────────────
const TRIGGER_THRESHOLDS = {
  heavy_rain:   { field: 'rainfall', threshold: 15, unit: 'mm/h' },
  extreme_rain: { field: 'rainfall', threshold: 50, unit: 'mm/h' },
  flood_risk:   { field: 'rainfall', threshold: 75, unit: 'mm/3h' },
  high_aqi:     { field: 'aqi',      threshold: 200, unit: 'AQI' },
  severe_aqi:   { field: 'aqi',      threshold: 300, unit: 'AQI' },
  high_wind:    { field: 'wind',      threshold: 80, unit: 'km/h' },
};

// ── Check if rainfall crosses claim trigger threshold ─────────────
export function checkRainSeverity(rainfall_mm) {
  if (rainfall_mm >= 50) return { level: 'Extreme', color: '#e05c5c', triggers: true, emoji: '⛈️' };
  if (rainfall_mm >= 25) return { level: 'Heavy',   color: '#f5a623', triggers: true, emoji: '🌧️' };
  if (rainfall_mm >= 10) return { level: 'Moderate',color: '#60a5fa', triggers: false, emoji: '🌦️' };
  return                        { level: 'Light',   color: '#00d4a8', triggers: false, emoji: '🌤️' };
}

// ── Live fetch from OpenWeatherMap (by city) ──────────────────────
async function fetchLiveWeather(city) {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)},IN&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`OWM ${res.status}`);
    const d = await res.json();
    return {
      temp:      Math.round(d.main.temp),
      humidity:  d.main.humidity,
      wind:      Math.round(d.wind.speed * 3.6),
      rainfall:  d.rain ? (d.rain['3h'] || d.rain['1h'] || 0) : 0,
      desc:      d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase()),
      icon:      getIconEmoji(d.weather[0].main),
      condition: d.weather[0].main,
      aqi:       0,
      live:      true,
    };
  } catch {
    return null;
  }
}

// ── Live fetch from OpenWeatherMap (by lat/lng) ───────────────────
async function fetchLiveWeatherByCoords(lat, lng) {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`OWM ${res.status}`);
    const d = await res.json();
    return {
      temp:      Math.round(d.main.temp),
      humidity:  d.main.humidity,
      wind:      Math.round(d.wind.speed * 3.6),
      rainfall:  d.rain ? (d.rain['1h'] || d.rain['3h'] || 0) : 0,
      desc:      d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase()),
      icon:      getIconEmoji(d.weather[0].main),
      condition: d.weather[0].main,
      aqi:       0,
      live:      true,
    };
  } catch {
    return null;
  }
}

function getIconEmoji(condition) {
  const map = {
    Thunderstorm: '⛈️', Drizzle: '🌦️', Rain: '🌧️',
    Snow: '❄️', Clear: '☀️', Clouds: '⛅', Mist: '🌫️', Fog: '🌫️',
  };
  return map[condition] || '🌤️';
}

// ── Get weather by city ───────────────────────────────────────────
export async function getWeatherByCity(city) {
  let data = null;
  if (API_KEY) data = await fetchLiveWeather(city);
  if (!data) {
    const mock = MOCK_WEATHER[city] || DEFAULT_MOCK;
    data = { ...mock, live: false };
  }
  const severity = checkRainSeverity(data.rainfall);
  return { ...data, severity };
}

// ── Get weather at lat/lng (for ML service) ───────────────────────
export async function getWeatherAtLocation(lat, lng) {
  let data = null;
  if (API_KEY) data = await fetchLiveWeatherByCoords(lat, lng);
  if (!data) {
    // Fallback: closest mock city based on lat
    if (lat > 25) data = { ...MOCK_WEATHER['Delhi NCR'], live: false };
    else if (lat > 18) data = { ...MOCK_WEATHER['Mumbai'], live: false };
    else if (lat > 15) data = { ...MOCK_WEATHER['Hyderabad'], live: false };
    else if (lat > 12.5) data = { ...MOCK_WEATHER['Bengaluru'], live: false };
    else data = { ...MOCK_WEATHER['Chennai'], live: false };
  }
  const severity = checkRainSeverity(data.rainfall);
  return { ...data, severity };
}

// ── Evaluate parametric triggers ──────────────────────────────────
export function evaluateTriggers(weatherData) {
  const fired = [];
  const rainfall = weatherData?.rainfall || 0;
  const aqi = weatherData?.aqi || 0;
  const wind = weatherData?.wind || 0;

  if (rainfall >= 50) fired.push('extreme_rain');
  else if (rainfall >= 15) fired.push('heavy_rain');
  if (rainfall >= 75) fired.push('flood_risk');
  if (aqi >= 300) fired.push('severe_aqi');
  else if (aqi >= 200) fired.push('high_aqi');
  if (wind >= 80) fired.push('high_wind');

  return {
    triggers_fired: fired,
    auto_trigger: fired.length > 0,
    rainfall_mm: rainfall,
    aqi: aqi,
    wind_kmh: wind,
  };
}

// ── Check all zones for trigger breaches ─────────────────────────
export async function checkAllZoneTriggers(zones) {
  const results = [];
  for (const zone of zones) {
    const weather = await getWeatherByCity(zone.city);
    const triggers = evaluateTriggers(weather);
    results.push({
      zone: zone.name,
      city: zone.city,
      weather,
      ...triggers,
    });
  }
  return results;
}
