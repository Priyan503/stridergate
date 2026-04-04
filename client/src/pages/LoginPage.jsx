import { useState, useEffect } from 'react';

// Animated rain background
function RainBg() {
  const drops = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${0.8 + Math.random() * 1.2}s`,
    opacity: 0.3 + Math.random() * 0.5,
  }));
  return (
    <div className="rain-bg">
      {drops.map(d => (
        <div key={d.id} className="raindrop" style={{
          left: d.left, animationDelay: d.delay,
          animationDuration: d.duration, opacity: d.opacity,
        }} />
      ))}
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [workers, setWorkers]     = useState([]);
  const [selWorker, setSelWorker] = useState('W001');
  const [loading, setLoading]     = useState(null);

  useEffect(() => {
    fetch('/api/auth/workers')
      .then(r => r.json())
      .then(d => { if (d.success) setWorkers(d.data); })
      .catch(() => setWorkers([
        { workerId: 'W001', name: 'Ravi Kumar',   platform: 'Swiggy' },
        { workerId: 'W002', name: 'Priya Sharma', platform: 'Zomato' },
        { workerId: 'W003', name: 'Arjun Mehta',  platform: 'Swiggy' },
        { workerId: 'W004', name: 'Deepa Nair',   platform: 'Zomato' },
      ]));
  }, []);

  const doLogin = async (role) => {
    setLoading(role);
    try {
      const body = role === 'worker' ? { role, workerId: selWorker } : { role };
      const res  = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('gs_token', data.token);
        sessionStorage.setItem('gs_role',  data.role);
        sessionStorage.setItem('gs_user',  JSON.stringify(data.user));
        onLogin(data.role, data.user);
      }
    } catch {
      // fallback direct login
      const user = role === 'worker'
        ? workers.find(w => w.workerId === selWorker) || workers[0]
        : { name: 'GigShield Admin' };
      onLogin(role, user);
    }
    setLoading(null);
  };

  return (
    <div className="login-page">
      <RainBg />
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo float">🛡️</div>
          <h1 className="login-title serif">GigShield</h1>
          <p className="login-subtitle">Parametric Income Insurance for Swiggy & Zomato Riders</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['OpenWeatherMap', 'Leaflet Maps', 'Razorpay (Test)', 'Anti-Spoofing BCS'].map(t => (
              <span key={t} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,212,168,0.08)', border: '1px solid rgba(0,212,168,0.2)', color: 'var(--accent)' }}>{t}</span>
            ))}
          </div>
        </div>

        <div className="login-cards">
          {/* Worker Card */}
          <div className="login-card">
            <div className="login-card-icon">🏍️</div>
            <div className="login-card-title">I'm a Rider</div>
            <div className="login-card-desc">View your insurance policy, track claims, check live weather for your zone, and pay your weekly premium.</div>
            <ul className="login-card-features">
              <li>My policy & coverage details</li>
              <li>My claim history & status</li>
              <li>Live weather for my zone</li>
              <li>ISS score & BCS trust rating</li>
              <li>Pay premium via Razorpay</li>
            </ul>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Select Your Profile</label>
              <select className="worker-select" value={selWorker} onChange={e => setSelWorker(e.target.value)}>
                {workers.map(w => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.name} — {w.platform} ({w.workerId})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => doLogin('worker')} disabled={loading === 'worker'}>
              {loading === 'worker' ? <><span className="spinner" /> Logging in...</> : '🏍️ Enter as Rider'}
            </button>
          </div>

          {/* Admin Card */}
          <div className="login-card admin-card">
            <div className="login-card-icon">🏢</div>
            <div className="login-card-title">I'm an Admin</div>
            <div className="login-card-desc">Full insurer control panel — verify workers, approve claims, trigger payouts, monitor fraud, and analyze risk.</div>
            <ul className="login-card-features" style={{ '--accent': 'var(--blue)' }}>
              <li>All workers — verify & manage</li>
              <li>All claims — approve, reject & pay</li>
              <li>Parametric trigger engine</li>
              <li>Fraud & anti-spoofing analysis</li>
              <li>Risk forecast & payout ledger</li>
            </ul>
            <div style={{ height: 44, marginBottom: 12 }} /> {/* spacer to align buttons */}
            <button className="btn btn-full" style={{ background: 'rgba(96,165,250,0.12)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.3)' }} onClick={() => doLogin('admin')} disabled={loading === 'admin'}>
              {loading === 'admin' ? <><span className="spinner" style={{ borderTopColor: 'var(--blue)' }} /> Logging in...</> : '🏢 Enter as Admin'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          GigShield v2.0 · All data is demo/mock · No real money transferred
        </div>
      </div>
    </div>
  );
}
