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
  const [selWorker, setSelWorker] = useState('');
  const [loading, setLoading]     = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/workers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setWorkers(d.data);
          setSelWorker(d.data[0].workerId);
        }
      })
      .catch(() => setError('Could not connect to server'));
  }, []);

  const doLogin = async (role) => {
    setLoading(role);
    setError('');
    try {
      const body = role === 'worker' ? { role, workerId: selWorker } : { role };
      const res  = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('gs_token', data.token);
        sessionStorage.setItem('gs_role',  data.role);
        sessionStorage.setItem('gs_user',  JSON.stringify(data.user));
        onLogin(data.role, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Could not connect to server. Make sure the backend is running.');
    }
    setLoading(null);
  };

  return (
    <div className="login-page">
      <RainBg />
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo float">🛡️</div>
          <h1 className="login-title serif">Shielded Rider</h1>
          <p className="login-subtitle">AI-Powered Parametric Income Insurance for Gig Workers</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['ML Risk Engine', 'XGBoost + LightGBM', 'Anti-Spoofing AI', 'Auto Payouts'].map(t => (
              <span key={t} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-dim)', border: '1px solid rgba(230,161,15,0.25)', color: 'var(--accent)' }}>{t}</span>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <div className="login-cards">
          {/* Worker Card */}
          <div className="login-card">
            <div className="login-card-icon">🏍️</div>
            <div className="login-card-title">I'm a Rider</div>
            <div className="login-card-desc">View your insurance policy, track claims, check live weather, and pay your weekly premium.</div>
            <ul className="login-card-features">
              <li>My policy & coverage details</li>
              <li>My claim history & ML scores</li>
              <li>Live weather for my zone</li>
              <li>Trust score & risk profile</li>
              <li>Pay premium via Razorpay</li>
            </ul>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Select Your Profile</label>
              <select className="worker-select" value={selWorker} onChange={e => setSelWorker(e.target.value)}>
                {workers.length === 0 && <option>Loading riders...</option>}
                {workers.map(w => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.name} — {w.platform} ({w.workerId})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => doLogin('worker')} disabled={loading === 'worker' || workers.length === 0}>
              {loading === 'worker' ? <><span className="spinner" /> Logging in...</> : '🏍️ Enter as Rider'}
            </button>
          </div>

          {/* Admin Card */}
          <div className="login-card admin-card">
            <div className="login-card-icon">🏢</div>
            <div className="login-card-title">I'm an Admin</div>
            <div className="login-card-desc">Full insurer control panel — manage riders, approve claims, configure triggers, run ML analysis.</div>
            <ul className="login-card-features" style={{ '--accent': 'var(--blue)' }}>
              <li>Onboard & manage all riders</li>
              <li>Claims — approve, reject & pay</li>
              <li>Trigger engine — simulate disruptions</li>
              <li>5-layer ML fraud analysis</li>
              <li>Risk forecast & payout ledger</li>
            </ul>
            <div style={{ height: 44, marginBottom: 12 }} /> {/* spacer to align buttons */}
            <button className="btn btn-full" style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1.5px solid rgba(25,120,229,0.3)' }} onClick={() => doLogin('admin')} disabled={loading === 'admin'}>
              {loading === 'admin' ? <><span className="spinner" style={{ borderTopColor: 'var(--blue)' }} /> Logging in...</> : '🏢 Enter as Admin'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          Shielded Rider v3.0 · ML-Powered · All data is demo/mock · No real money transferred
        </div>
      </div>
    </div>
  );
}
