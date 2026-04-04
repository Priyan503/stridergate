import { useState, useEffect } from 'react';

function checkRainSeverity(rainfall) {
  if (rainfall >= 50) return { level: 'Extreme', color: 'var(--danger)', emoji: '⛈️', triggers: true };
  if (rainfall >= 25) return { level: 'Heavy',   color: 'var(--warn)',   emoji: '🌧️', triggers: true };
  if (rainfall >= 10) return { level: 'Moderate',color: 'var(--blue)',   emoji: '🌦️', triggers: false };
  return               { level: 'Light',   color: 'var(--safe)',   emoji: '🌤️', triggers: false };
}

export default function WeatherWidget({ city }) {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/weather/${encodeURIComponent(city || 'Bengaluru')}`);
      const data = await res.json();
      if (data.success) { setWeather(data.data); setLastRefresh(new Date()); }
    } catch {
      // mock if server down
      setWeather({ temp: 28, humidity: 82, wind: 14, rainfall: 34.2, desc: 'Heavy Rain', icon: '🌧️', live: false });
    }
    setLoading(false);
  };

  useEffect(() => { fetchWeather(); }, [city]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  if (loading && !weather) return (
    <div className="weather-widget" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
      <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
    </div>
  );

  if (!weather) return null;
  const sev = checkRainSeverity(weather.rainfall || 0);

  return (
    <div className="weather-widget fade-in">
      <div className="weather-live-badge">
        <span className="live-dot" />
        {weather.live ? 'LIVE' : 'MOCK'}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div className="weather-icon">{weather.icon || '🌤️'}</div>
          <div className="weather-temp">{weather.temp}°C</div>
          <div className="weather-desc">{weather.desc}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{city}</div>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div className="weather-stats">
        <div className="weather-stat">
          <div className="weather-stat-label">Humidity</div>
          <div className="weather-stat-val">{weather.humidity}%</div>
        </div>
        <div className="weather-stat">
          <div className="weather-stat-label">Wind</div>
          <div className="weather-stat-val">{weather.wind} km/h</div>
        </div>
        <div className="weather-stat">
          <div className="weather-stat-label">Rainfall</div>
          <div className="weather-stat-val" style={{ color: weather.rainfall > 25 ? 'var(--danger)' : 'var(--text)' }}>
            {weather.rainfall.toFixed(1)} mm
          </div>
        </div>
        <div className="weather-stat">
          <div className="weather-stat-label">Severity</div>
          <div className="weather-stat-val" style={{ fontSize: 12, color: sev.color }}>{sev.level}</div>
        </div>
      </div>

      {sev.triggers && (
        <div className="weather-rain-alert" style={{ background: `${sev.color}15`, border: `1px solid ${sev.color}35`, color: sev.color }}>
          ⚡ {sev.level} Rain — Parametric trigger threshold crossed!
        </div>
      )}

      {lastRefresh && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, textAlign: 'right' }}>
          Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          <button onClick={fetchWeather} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 10 }}>↻ Refresh</button>
        </div>
      )}
    </div>
  );
}
