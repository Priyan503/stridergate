/**
 * Weather Service — OpenWeatherMap integration with mock fallback
 * If OPENWEATHER_API_KEY is not set, returns realistic mock data
 */

const API_KEY = process.env.OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ── Mock weather data per city ────────────────────────────────────
const MOCK_WEATHER = {
  Bengaluru:  { temp: 28, humidity: 82, wind: 14, rainfall: 34.2, desc: 'Heavy Rain', icon: '🌧️', condition: 'Rain' },
  Chennai:    { temp: 33, humidity: 76, wind: 18, rainfall: 8.1,  desc: 'Light Rain', icon: '🌦️', condition: 'Drizzle' },
  Mumbai:     { temp: 31, humidity: 88, wind: 22, rainfall: 52.6, desc: 'Torrential Rain', icon: '⛈️', condition: 'Thunderstorm' },
  Hyderabad:  { temp: 36, humidity: 64, wind: 10, rainfall: 2.4,  desc: 'Partly Cloudy', icon: '⛅', condition: 'Clouds' },
  'Delhi NCR':{ temp: 38, humidity: 45, wind: 12, rainfall: 0,    desc: 'Clear Sky',    icon: '☀️', condition: 'Clear' },
};

const DEFAULT_MOCK = { temp: 30, humidity: 70, wind: 12, rainfall: 5.0, desc: 'Partly Cloudy', icon: '⛅', condition: 'Clouds' };

// ── Check if rainfall crosses claim trigger threshold ─────────────
export function checkRainSeverity(rainfall_mm) {
  if (rainfall_mm >= 50) return { level: 'Extreme', color: '#e05c5c', triggers: true, emoji: '⛈️' };
  if (rainfall_mm >= 25) return { level: 'Heavy',   color: '#f5a623', triggers: true, emoji: '🌧️' };
  if (rainfall_mm >= 10) return { level: 'Moderate',color: '#60a5fa', triggers: false, emoji: '🌦️' };
  return                        { level: 'Light',   color: '#00d4a8', triggers: false, emoji: '🌤️' };
}

// ── Live fetch from OpenWeatherMap ────────────────────────────────
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
      wind:      Math.round(d.wind.speed * 3.6), // m/s → km/h
      rainfall:  d.rain ? (d.rain['3h'] || d.rain['1h'] || 0) : 0,
      desc:      d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase()),
      icon:      getIconEmoji(d.weather[0].main),
      condition: d.weather[0].main,
      live:      true,
    };
  } catch (err) {
    return null; // triggers fallback
  }
}

function getIconEmoji(condition) {
  const map = {
    Thunderstorm: '⛈️', Drizzle: '🌦️', Rain: '🌧️',
    Snow: '❄️', Clear: '☀️', Clouds: '⛅', Mist: '🌫️', Fog: '🌫️',
  };
  return map[condition] || '🌤️';
}

// ── Main export ───────────────────────────────────────────────────
export async function getWeatherByCity(city) {
  let data = null;

  if (API_KEY) {
    data = await fetchLiveWeather(city);
  }

  if (!data) {
    // Mock fallback — realistic data per city
    const mock = MOCK_WEATHER[city] || DEFAULT_MOCK;
    data = { ...mock, live: false };
  }

  const severity = checkRainSeverity(data.rainfall);
  return { ...data, severity };
}

// ── Check all zones for trigger breaches ─────────────────────────
export async function checkAllZoneTriggers(zones) {
  const results = [];
  for (const zone of zones) {
    const weather = await getWeatherByCity(zone.city);
    results.push({
      zone:      zone.name,
      city:      zone.city,
      weather,
      triggered: weather.severity.triggers,
    });
  }
  return results;
}
