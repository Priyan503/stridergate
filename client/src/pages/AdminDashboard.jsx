import { useState, useEffect } from 'react';
import BCSBadge from '../components/BCSBadge';
import StatusBadge from '../components/StatusBadge';
import ZoneMap from '../components/ZoneMap';
import WeatherWidget from '../components/WeatherWidget';
import { TRIGGERS as INIT_TRIGGERS } from '../data/mockData';

// ── Overview Sub-tab ──────────────────────────────────────────────
function Overview({ stats }) {
  const { activePolicies, claimsProcessed, flaggedClaims, totalPayout, lossRatio, weeklyData, days, riskForecast, systemStatus } = stats;
  const maxBar = Math.max(...weeklyData);
  return (
    <div className="fade-in">
      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Policies',   value: activePolicies,    sub: '+2 this week',              up: true,  icon: '🛡️' },
          { label: 'Claims Processed',  value: claimsProcessed,   sub: `₹${totalPayout} paid out`,  up: true,  icon: '✅' },
          { label: 'Flagged Claims',    value: flaggedClaims,     sub: 'Under review',              up: false, icon: '🚩' },
          { label: 'Loss Ratio',        value: lossRatio,         sub: 'Healthy — threshold <60%',  up: true,  icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Weekly Claims Volume</div>
          <div className="bar-chart" style={{ marginTop: 16 }}>
            {weeklyData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="bar" style={{
                  height: `${(v / maxBar) * 80}px`,
                  background: i === 6 ? 'var(--accent)' : 'var(--surface2)',
                  border: `1px solid ${i === 6 ? 'rgba(0,212,168,0.5)' : 'var(--border)'}`,
                  width: '100%',
                }} />
                <div className="bar-label">{days[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>Sunday peak due to monsoon trigger</div>
        </div>

        <div className="card">
          <div className="card-title">7-Day Risk Forecast</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {riskForecast.map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span>{r.zone}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', color: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }}>{r.risk}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.risk}%`, background: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Powered by historical flood + weather data</div>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="card">
          <div className="card-title">System Status</div>
          <div className="grid4" style={{ marginTop: 12 }}>
            {Object.entries(systemStatus).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div style={{ color: v.includes('LIVE') || v.includes('ACTIVE') ? 'var(--safe)' : v.includes('MOCK') || v.includes('TEST') ? 'var(--warn)' : 'var(--text)', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workers Sub-tab ───────────────────────────────────────────────
function Workers({ showToast }) {
  const [workers, setWorkers] = useState([]);
  useEffect(() => { fetch('/api/workers').then(r => r.json()).then(d => { if (d.success) setWorkers(d.data); }); }, []);

  const doVerify = async (id) => {
    const res  = await fetch(`/api/workers/${id}/verify`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { setWorkers(p => p.map(w => w.workerId === id ? data.data : w)); showToast(`${data.data.name} verified ✓`, 'success'); }
  };
  const doStatus = async (id, status) => {
    const res  = await fetch(`/api/workers/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (data.success) { setWorkers(p => p.map(w => w.workerId === id ? data.data : w)); showToast(`Status updated to ${status}`, 'info'); }
  };

  return (
    <div className="fade-in">
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr>
            <th>Worker</th><th>Platform</th><th>Zone</th><th>Plan</th><th>Premium</th><th>BCS</th><th>Status</th><th>Verified</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.workerId}>
                <td>
                  <div style={{ fontWeight: 500 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono' }}>{w.workerId}</div>
                </td>
                <td>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: w.platform === 'Swiggy' ? 'rgba(245,85,0,0.12)' : 'rgba(220,50,50,0.12)', color: w.platform === 'Swiggy' ? '#f55500' : '#dc3232' }}>
                    {w.platform}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>{w.zone}, {w.city}</td>
                <td>{w.plan}</td>
                <td style={{ fontFamily: 'DM Mono', color: 'var(--safe)' }}>₹{w.premium}</td>
                <td><BCSBadge score={w.bcs} /></td>
                <td><StatusBadge status={w.status} /></td>
                <td>{w.verified ? <span className="verified-chip yes">✓</span> : <span className="verified-chip no">Pending</span>}</td>
                <td>
                  <div className="actions">
                    {!w.verified && <button className="btn btn-xs btn-blue" onClick={() => doVerify(w.workerId)}>Verify</button>}
                    {w.status === 'active' && <button className="btn btn-xs btn-danger-soft" onClick={() => doStatus(w.workerId, 'flagged')}>Flag</button>}
                    {w.status === 'flagged' && <button className="btn btn-xs" style={{ background: 'rgba(0,212,168,0.1)', color: 'var(--safe)', border: '1px solid rgba(0,212,168,0.25)', borderRadius: 7, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }} onClick={() => doStatus(w.workerId, 'active')}>Restore</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Claims Sub-tab ────────────────────────────────────────────────
function Claims({ showToast }) {
  const [claims, setClaims]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [paying, setPaying]   = useState(null);

  useEffect(() => { fetch('/api/claims').then(r => r.json()).then(d => { if (d.success) setClaims(d.data); }); }, []);

  const doApprove = async (id, amount, workerId) => {
    const res  = await fetch(`/api/claims/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Approved by admin' }) });
    const data = await res.json();
    if (data.success) { setClaims(p => p.map(c => c.claimId === id ? data.data : c)); showToast(`Claim ${id} approved!`, 'success'); }
    // Also trigger payout
    setPaying(id);
    await fetch(`/api/payments/payout/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId, amount }) });
    setPaying(null);
    showToast(`₹${amount} payout initiated to ${workerId}`, 'success');
  };
  const doReject = async (id) => {
    const res  = await fetch(`/api/claims/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Rejected by admin' }) });
    const data = await res.json();
    if (data.success) { setClaims(p => p.map(c => c.claimId === id ? data.data : c)); showToast(`Claim ${id} rejected`, 'warning'); }
  };

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all','paid','flagged','rejected','pending'].map(f => (
          <button key={f} className={`sub-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ padding: '5px 14px', fontSize: 12 }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: 5, opacity: 0.6 }}>({claims.filter(c => c.status === f).length})</span>}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Claim ID</th><th>Worker</th><th>Zone</th><th>Trigger</th><th>Amount</th><th>BCS</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.claimId}>
                <td><span className="mono" style={{ fontSize: 12 }}>{c.claimId}</span></td>
                <td style={{ fontWeight: 500 }}>{c.worker}<div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.workerId}</div></td>
                <td style={{ color: 'var(--muted)' }}>{c.zone}</td>
                <td>{c.trigger}</td>
                <td style={{ fontWeight: 700, color: 'var(--safe)' }}>₹{c.amount}</td>
                <td><BCSBadge score={c.bcs} /></td>
                <td><StatusBadge status={c.status} /></td>
                <td style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>{c.date} {c.time}</td>
                <td>
                  {(c.status === 'flagged' || c.status === 'pending') && (
                    <div className="actions">
                      <button className="btn btn-xs" style={{ background: 'rgba(0,212,168,0.1)', color: 'var(--safe)', border: '1px solid rgba(0,212,168,0.2)', padding: '4px 10px', fontSize: 11, borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => doApprove(c.claimId, c.amount, c.workerId)} disabled={paying === c.claimId}>
                        {paying === c.claimId ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />Paying...</> : '✓ Approve & Pay'}
                      </button>
                      <button className="btn btn-xs btn-danger-soft" onClick={() => doReject(c.claimId)}>✗ Reject</button>
                    </div>
                  )}
                  {c.status === 'paid' && <span style={{ fontSize: 11, color: 'var(--safe)' }}>✓ Paid</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Triggers Sub-tab ──────────────────────────────────────────────
function Triggers({ showToast }) {
  const [triggers, setTriggers] = useState(INIT_TRIGGERS);
  const [simulating, setSimulating] = useState(null);

  const simulate = (id) => {
    setSimulating(id);
    fetch(`/api/triggers/${id}/simulate`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setTriggers(p => p.map(t => t.id === id ? { ...t, fired: true, current: d.data.current } : t));
        showToast(`${d.data?.name || 'Trigger'} fired! Auto-claims initiated.`, 'warning');
      })
      .finally(() => setSimulating(null));
    // Optimistic update while waiting
    setTimeout(() => setSimulating(null), 2500);
  };
  const reset = (id) => {
    fetch(`/api/triggers/${id}/reset`, { method: 'POST' }).then(r => r.json())
      .then(d => { if (d.success) setTriggers(p => p.map(t => t.id === id ? { ...t, fired: false, current: INIT_TRIGGERS.find(x => x.id === id)?.current || '0' } : t)); });
  };

  return (
    <div className="fade-in">
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <span>⚡</span>
        <span>Trigger simulation initiates automatic claims for all affected workers in that zone. BCS analysis runs before payout.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {triggers.map(t => (
          <div key={t.id} className={`trigger-card ${t.fired ? 'fired' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 12 }}>
              <span className="trigger-icon">{t.icon}</span>
              <div>
                <div className="trigger-name">{t.name}</div>
                <div className="trigger-threshold">{t.source} · {t.threshold}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 20 }}>
              <div className="trigger-value" style={{ color: t.fired ? 'var(--danger)' : 'var(--text)' }}>{t.current}</div>
              {t.unit && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.unit}</div>}
            </div>
            {t.fired
              ? <><span className="badge badge-red"><span className="badge-dot" />FIRED</span><button className="btn btn-sm btn-secondary" onClick={() => reset(t.id)} style={{ marginLeft: 10 }}>Reset</button></>
              : <button className="btn btn-sm btn-danger-soft" onClick={() => simulate(t.id)} disabled={simulating === t.id}>
                  {simulating === t.id ? <><span className="spinner" />Simulating...</> : '⚡ Simulate'}
                </button>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fraud Sub-tab ─────────────────────────────────────────────────
function Fraud({ showToast }) {
  const [workers, setWorkers]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]     = useState(null);

  useEffect(() => { fetch('/api/workers').then(r => r.json()).then(d => { if (d.success) setWorkers(d.data); }); }, []);

  const analyze = (w) => {
    setSelected(w); setResult(null); setAnalyzing(true);
    fetch(`/api/claims/-/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bcs: w.bcs }) })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          setAnalyzing(false);
          // Generate BCS layers locally
          const bcs = w.bcs;
          setResult({
            worker: w,
            layers: [
              { name: 'Movement Intelligence',     score: bcs > 60 ? Math.min(bcs+8,98) : Math.max(bcs-10,0), pass: bcs>60, detail: bcs>60 ? 'Natural road-speed motion (15–40 km/h)' : 'Static device — no movement pattern' },
              { name: 'Environmental Cross-Match', score: bcs > 60 ? Math.min(bcs+5,97) : Math.max(bcs-8,0),  pass: bcs>60, detail: bcs>60 ? 'Rain intensity matches halt threshold' : 'Traffic API: clear roads contradict claim' },
              { name: 'Sensor & Device Profile',   score: bcs > 60 ? Math.max(bcs-3,0)  : Math.max(bcs-12,0), pass: bcs>60, detail: bcs>60 ? 'Accelerometer consistent with sheltering' : 'Flat sensor data — no real movement' },
              { name: 'Fraud Ring Detection',       score: bcs > 40 ? Math.min(bcs+2,96) : Math.max(bcs-5,0),  pass: bcs>40, detail: bcs>60 ? 'No coordinated spike detected' : bcs>40 ? 'Watch pattern — monitoring' : '3 claims from same device cluster' },
              { name: 'Anti-Spoofing (GPS Drift)',  score: bcs > 60 ? Math.floor(Math.random()*15)+80 : bcs > 40 ? Math.floor(Math.random()*20)+50 : Math.floor(Math.random()*30)+10, pass: bcs>=50, detail: bcs>=70 ? 'Natural GPS drift — consistent with road movement' : bcs>=50 ? 'Minor GPS anomaly — within acceptable range' : 'GPS spoofing likely — implausibly smooth coordinates' },
            ],
            verdict: bcs>=70 ? { text:'Auto-Approved', color:'var(--safe)', action:'Payout within 5 minutes via UPI' } : bcs>=40 ? { text:'Soft Review', color:'var(--warn)', action:'Passive checks — payout within 2 hours' } : { text:'Claim Held / GPS Spoofing', color:'var(--danger)', action:'Location confirmation requested. Challenge-response verification.' },
          });
        }, 2000);
      });
  };

  return (
    <div className="fade-in">
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Select Worker to Analyze</div>
          {workers.map(w => (
            <div key={w.workerId} onClick={() => analyze(w)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selected?.workerId === w.workerId ? 'var(--accent)' : 'var(--border)'}`, background: selected?.workerId === w.workerId ? 'rgba(0,212,168,0.05)' : 'var(--surface)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{w.zone} · {w.platform} · {w.status}</div>
              </div>
              <BCSBadge score={w.bcs} />
            </div>
          ))}
        </div>
        <div>
          {analyzing && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Running 5-layer BCS analysis...</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>GPS drift · Sensor profile · Fraud rings · Anti-spoofing</div>
            </div>
          )}
          {result && !analyzing && (
            <div className="fade-in">
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{result.worker.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{result.worker.zone} · {result.worker.platform}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: result.worker.bcs >= 70 ? 'var(--safe)' : result.worker.bcs >= 40 ? 'var(--warn)' : 'var(--danger)' }}>{result.worker.bcs}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>BCS Score</div>
                  </div>
                </div>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <div className="bcs-meter" />
                  <div className="bcs-marker" style={{ left: `${result.worker.bcs}%` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--muted)' }}>
                    <span>0 — Held</span><span>40 — Review</span><span>70 — Auto-Approve</span><span>100</span>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: `${result.verdict.color}15`, border: `1px solid ${result.verdict.color}40` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: result.verdict.color }}>{result.verdict.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{result.verdict.action}</div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">5-Layer Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                  {result.layers.map((l, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{l.pass ? '✅' : '🚩'}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'DM Mono', color: l.pass ? 'var(--safe)' : 'var(--danger)' }}>{l.score}/100</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${l.score}%`, background: l.pass ? 'var(--safe)' : 'var(--danger)' }} /></div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{l.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!result && !analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>← Select a worker to run BCS analysis</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payouts Sub-tab ───────────────────────────────────────────────
function Payouts() {
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    fetch('/api/payments').then(r => r.json()).then(d => { if (d.success) setPayments(d.data); })
      .catch(() => setPayments([
        { payoutId: 'mock_payout_001', workerId: 'W001', amount: 280, status: 'processed', method: 'UPI', processedAt: new Date().toISOString(), type: 'payout', claimId: 'CLM-0042' },
        { payoutId: 'mock_payout_002', workerId: 'W004', amount: 210, status: 'processed', method: 'UPI', processedAt: new Date().toISOString(), type: 'payout', claimId: 'CLM-0041' },
      ]));
  }, []);

  return (
    <div className="fade-in">
      {payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          No payouts yet. Approve flagged claims to process payouts.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Payout ID</th><th>Type</th><th>Worker</th><th>Claim</th><th>Amount</th><th>Method</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td><span className="mono" style={{ fontSize: 11 }}>{p.payoutId?.slice(-12) || '—'}</span></td>
                  <td><span className={`badge ${p.type === 'payout' ? 'badge-green' : 'badge-blue'}`}>{p.type}</span></td>
                  <td>{p.workerId || '—'}</td>
                  <td><span className="mono" style={{ fontSize: 11 }}>{p.claimId || '—'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--safe)' }}>₹{p.amount}</td>
                  <td>{p.method || 'UPI'}</td>
                  <td><span className="badge badge-green">processed</span></td>
                  <td style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono' }}>{p.processedAt ? new Date(p.processedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────
export default function AdminDashboard({ activePage, showToast }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); });
  }, []);

  const titles = {
    overview: { title: 'Insurer Dashboard', sub: 'GigShield Operations · Week of Apr 1–7, 2026' },
    workers:  { title: 'Worker Registry',   sub: 'Manage, verify and monitor all insured riders' },
    claims:   { title: 'Claims Management', sub: 'Review, approve and process claim payouts' },
    triggers: { title: 'Trigger Engine',    sub: 'Parametric disruption signals — real-time monitoring' },
    fraud:    { title: 'Fraud & BCS Engine', sub: '5-layer anti-spoofing behavioral analysis' },
    payouts:  { title: 'Payout Ledger',     sub: 'All premium payments and claim payouts' },
  };
  const current = titles[activePage] || titles.overview;

  return (
    <div className="page fade-in">
      <div className="top-bar">
        <div>
          <div className="page-title serif">{current.title}</div>
          <div className="page-subtitle">{current.sub}</div>
        </div>
        <div className="top-bar-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--safe)', padding: '6px 14px', background: 'rgba(0,212,168,0.07)', border: '1px solid rgba(0,212,168,0.2)', borderRadius: 20 }}>
            <span className="live-dot" /> Live monitoring
          </div>
        </div>
      </div>

      {activePage === 'overview' && (stats ? <Overview stats={stats} /> : <div style={{ color: 'var(--muted)' }}>Loading...</div>)}
      {activePage === 'workers'  && <Workers showToast={showToast} />}
      {activePage === 'claims'   && <Claims  showToast={showToast} />}
      {activePage === 'triggers' && <Triggers showToast={showToast} />}
      {activePage === 'fraud'    && <Fraud   showToast={showToast} />}
      {activePage === 'payouts'  && <Payouts />}
    </div>
  );
}
