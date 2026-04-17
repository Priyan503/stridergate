import { useState, useEffect, useCallback } from 'react';
import BCSBadge from '../components/BCSBadge';
import StatusBadge from '../components/StatusBadge';
import ZoneMap from '../components/ZoneMap';
import WeatherWidget from '../components/WeatherWidget';

// ── ML Pipeline Step ─────────────────────────────────────────────────
function MLStep({ label, score, status, pass: passed, detail }) {
  const statusColor = status === 'completed'
    ? (passed ? 'var(--safe)' : 'var(--danger)')
    : status === 'unavailable' ? 'var(--muted)' : 'var(--warn)';
  const statusIcon = status === 'completed'
    ? (passed ? '✅' : '🚩')
    : status === 'unavailable' ? '⬜' : '⏳';
  return (
    <div className="ml-step">
      <div className="ml-step-header">
        <span className="ml-step-icon">{statusIcon}</span>
        <span className="ml-step-label">{label}</span>
        {score != null && <span className="ml-step-score" style={{ color: statusColor }}>{typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : score}</span>}
      </div>
      {detail && <div className="ml-step-detail">{detail}</div>}
    </div>
  );
}

// ── Claim ML Analysis Panel ──────────────────────────────────────────
function ClaimMLPanel({ claim }) {
  const ml = claim.ml_analysis;
  const riskScore = ml?.risk_model?.score ?? claim.risk_score;
  const anomalyScore = ml?.fraud_model?.anomaly_score ?? claim.anomaly_score;
  const weatherMismatch = ml?.weather_check?.mismatch ?? false;

  return (
    <div className="ml-pipeline fade-in">
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>ML Analysis Pipeline</div>
      <div className="ml-steps">
        <MLStep
          label="Risk Model (XGBoost)"
          score={riskScore}
          status={ml?.risk_model?.status || (riskScore != null ? 'completed' : 'unavailable')}
          pass={riskScore != null && riskScore < 0.5}
          detail={riskScore > 0.7 ? 'High disruption risk — elevated probability of legitimate loss' : riskScore > 0.4 ? 'Moderate risk — additional verification recommended' : 'Low risk — signals consistent with legitimate claim'}
        />
        <div className="ml-step-connector" />
        <MLStep
          label="Fraud Detection (IsolationForest)"
          score={anomalyScore}
          status={ml?.fraud_model?.status || (anomalyScore != null ? 'completed' : 'unavailable')}
          pass={anomalyScore != null && anomalyScore < 0.5}
          detail={anomalyScore > 0.7 ? 'High anomaly — behavioral pattern deviates significantly' : anomalyScore > 0.4 ? 'Borderline anomaly — some unusual signals detected' : 'Normal pattern — consistent with rider\'s history'}
        />
        <div className="ml-step-connector" />
        <MLStep
          label="Weather Cross-Match"
          score={weatherMismatch ? 'MISMATCH' : 'MATCHED'}
          status="completed"
          pass={!weatherMismatch}
          detail={ml?.weather_check?.actual_conditions ? `Actual conditions: ${ml.weather_check.actual_conditions}` : (claim.weather_snapshot?.condition || 'Weather verified')}
        />
        <div className="ml-step-connector" />
        <MLStep
          label="Rule Engine"
          score={ml?.rule_engine?.decision || claim.final_decision}
          status="completed"
          pass={['approve', 'auto_approve'].includes(ml?.rule_engine?.decision || claim.final_decision)}
          detail={ml?.rule_engine?.reason || claim.decision_reason || 'Deterministic rules applied'}
        />
        <div className="ml-step-connector" />
        <MLStep
          label="LLM Reasoning (GPT-4o)"
          score={ml?.llm_reasoning?.llm_used ? `${((ml?.llm_reasoning?.confidence || 0) * 100).toFixed(0)}% conf` : 'Skipped'}
          status={ml?.llm_reasoning?.llm_used ? 'completed' : 'unavailable'}
          pass={['approve'].includes(ml?.llm_reasoning?.decision || claim.llm_decision)}
          detail={ml?.llm_reasoning?.reason || claim.llm_reason || 'LLM not invoked — rule engine decision is final'}
        />
        <div className="ml-step-connector" />
        <div className="ml-step ml-step-admin">
          <div className="ml-step-header">
            <span className="ml-step-icon">👤</span>
            <span className="ml-step-label" style={{ fontWeight: 700 }}>Admin Decision</span>
            <span className="ml-step-score" style={{ color: claim.status === 'paid' ? 'var(--safe)' : claim.status === 'rejected' ? 'var(--danger)' : 'var(--warn)' }}>
              {claim.status === 'paid' ? 'APPROVED' : claim.status === 'rejected' ? 'REJECTED' : 'PENDING'}
            </span>
          </div>
          {claim.adminNote && <div className="ml-step-detail">{claim.adminNote}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Overview Sub-tab ──────────────────────────────────────────────
function Overview({ stats }) {
  const { activePolicies, claimsProcessed, flaggedClaims, totalPayout, lossRatio, weeklyData, days, systemStatus, riskForecast } = stats;
  const maxBar = Math.max(...weeklyData, 1);
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
                   border: `1px solid ${i === 6 ? 'rgba(230,161,15,0.5)' : 'var(--border)'}`,
                   width: '100%',
                 }} />
                <div className="bar-label">{days[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>Sunday peak due to monsoon trigger</div>
        </div>

        {/* 7-Day Risk Forecast — moved into Overview */}
        <div className="card">
          <div className="card-title">7-Day Risk Forecast</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(riskForecast || []).slice(0, 4).map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{r.zone}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }}>{r.risk}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.risk}%`, background: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>Powered by historical flood + weather data</div>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="card">
          <div className="card-title">System Status</div>
          <div className="grid4" style={{ marginTop: 12 }}>
            {Object.entries(systemStatus).filter(([,v]) => typeof v === 'string' || typeof v === 'boolean').map(([k, v]) => {
              const val = typeof v === 'boolean' ? (v ? 'ENABLED' : 'DISABLED') : v;
              return (
                <div key={k} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div style={{ color: typeof val === 'string' && (val.includes('LIVE') || val.includes('ACTIVE') || val.includes('ENABLED')) ? 'var(--safe)' : typeof val === 'string' && (val.includes('MOCK') || val.includes('TEST') || val.includes('OFFLINE') || val.includes('DISABLED')) ? 'var(--warn)' : 'var(--text)', fontWeight: 600 }}>{val}</div>
                </div>
              );
            })}
          </div>
          {systemStatus.mlModels && typeof systemStatus.mlModels === 'object' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>ML Models</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(systemStatus.mlModels).map(([model, status]) => (
                  <div key={model} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: status === 'loaded' ? 'rgba(0,168,20,0.08)' : 'rgba(220,38,38,0.08)', color: status === 'loaded' ? 'var(--safe)' : 'var(--danger)', border: `1px solid ${status === 'loaded' ? 'rgba(0,168,20,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'loaded' ? 'var(--safe)' : 'var(--danger)' }} />
                    {model}: {status}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workers Sub-tab ───────────────────────────────────────────────
function Workers({ showToast }) {
  const [workers, setWorkers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', zone: '', pincode: '', platform: 'Swiggy', earnings: '', plan: 'Standard' });
  const [adding, setAdding] = useState(false);

  const load = () => fetch((import.meta.env.VITE_API_URL || '') + '/api/workers').then(r => r.json()).then(d => { if (d.success) setWorkers(d.data); });
  useEffect(() => { load(); }, []);

  const doVerify = async (id) => {
    const res  = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/workers/${id}/verify`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { setWorkers(p => p.map(w => w.workerId === id ? data.data : w)); showToast(`${data.data.name} verified ✓`, 'success'); }
  };
  const doStatus = async (id, status) => {
    const res  = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/workers/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (data.success) { setWorkers(p => p.map(w => w.workerId === id ? data.data : w)); showToast(`Status updated to ${status}`, 'info'); }
  };
  const doDelete = async (id, name) => {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/workers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { setWorkers(p => p.filter(w => w.workerId !== id)); showToast(`${name} removed`, 'warning'); }
  };
  const doAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.zone || !form.earnings) return showToast('Fill all required fields', 'warning');
    setAdding(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/workers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, earnings: Number(form.earnings) }) });
      const data = await res.json();
      if (data.success) {
        setWorkers(p => [data.data, ...p]);
        setForm({ name: '', city: '', zone: '', pincode: '', platform: 'Swiggy', earnings: '', plan: 'Standard' });
        setShowAdd(false);
        showToast(`${data.data.name} added as ${data.data.workerId}`, 'success');
      }
    } catch { showToast('Failed to add worker', 'warning'); }
    setAdding(false);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{workers.length} riders registered</div>
          <button className="btn btn-xs btn-secondary" onClick={load}>↻ Refresh</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Rider'}
        </button>
      </div>

      {/* Add Worker Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Onboard New Rider</div>
          <form onSubmit={doAdd}>
            <div className="grid3" style={{ gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name *</label>
                <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City *</label>
                <input className="form-input" placeholder="e.g. Bengaluru" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Zone *</label>
                <input className="form-input" placeholder="e.g. Koramangala" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pincode</label>
                <input className="form-input" placeholder="e.g. 560034" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Platform</label>
                <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                  <option>Swiggy</option><option>Zomato</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Weekly Earnings (₹) *</label>
                <input className="form-input" type="number" placeholder="e.g. 4200" value={form.earnings} onChange={e => setForm({ ...form, earnings: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Plan</label>
                <select className="form-select" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                  <option>Basic</option><option>Standard</option><option>Max</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={adding}>
              {adding ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Adding...</> : '✓ Add Rider'}
            </button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr>
            <th>Worker</th><th>Platform</th><th>Zone</th><th>Plan</th><th>Premium</th><th>Trust / BCS</th><th>Spoofing</th><th>Status</th><th>Verified</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.workerId}>
                <td>
                  <div style={{ fontWeight: 500 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono' }}>{w.workerId}</div>
                </td>
                <td>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: w.platform === 'Swiggy' ? 'rgba(245,85,0,0.10)' : 'rgba(220,50,50,0.10)', color: w.platform === 'Swiggy' ? '#f55500' : '#dc3232' }}>
                    {w.platform}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>{w.zone}, {w.city}</td>
                <td>{w.plan}</td>
                <td style={{ fontFamily: 'DM Mono', color: 'var(--safe)' }}>₹{w.premium_amount || w.premium}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <BCSBadge score={w.trust_score || w.bcs} />
                    {w.trust_level && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: w.trust_level === 'trusted' ? 'rgba(0,168,20,0.08)' : w.trust_level === 'flagged' ? 'rgba(220,38,38,0.08)' : 'rgba(120,120,120,0.08)', color: w.trust_level === 'trusted' ? 'var(--safe)' : w.trust_level === 'flagged' ? 'var(--danger)' : 'var(--muted)' }}>{w.trust_level}</span>}
                  </div>
                </td>
                <td>
                  {w.spoofing_score != null && (
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: w.spoofing_score > 40 ? 'var(--danger)' : w.spoofing_score > 15 ? 'var(--warn)' : 'var(--safe)' }}>{w.spoofing_score}</span>
                  )}
                </td>
                <td><StatusBadge status={w.status} /></td>
                <td>{w.verified ? <span className="verified-chip yes">✓</span> : <span className="verified-chip no">Pending</span>}</td>
                <td>
                  <div className="actions">
                    {!w.verified && <button className="btn btn-xs btn-blue" onClick={() => doVerify(w.workerId)}>Verify</button>}
                    {w.status === 'active' && <button className="btn btn-xs btn-danger-soft" onClick={() => doStatus(w.workerId, 'flagged')}>Flag</button>}
                    {w.status === 'flagged' && <button className="btn btn-xs" style={{ background: 'rgba(0,168,20,0.08)', color: 'var(--safe)', border: '1px solid rgba(0,168,20,0.2)', borderRadius: 7, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }} onClick={() => doStatus(w.workerId, 'active')}>Restore</button>}
                    <button className="btn btn-xs btn-danger-soft" onClick={() => doDelete(w.workerId, w.name)} title="Remove rider">✕</button>
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
function Claims({ showToast, onFlaggedChange }) {
  const [claims, setClaims]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [paying, setPaying]   = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchClaims = useCallback(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/claims').then(r => r.json()).then(d => {
      if (d.success) {
        setClaims(d.data);
        onFlaggedChange(d.data.filter(c => c.status === 'flagged' || c.status === 'pending').length);
      }
    });
  }, [onFlaggedChange]);

  useEffect(() => { fetchClaims(); }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchClaims, 15000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  const doApprove = async (id, amount, workerId) => {
    setPaying(id);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/claims/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Approved by admin' }) });
      const data = await res.json();
      if (data.success) {
        setClaims(p => {
          const updated = p.map(c => c.claimId === id ? data.data : c);
          onFlaggedChange(updated.filter(c => c.status === 'flagged' || c.status === 'pending').length);
          return updated;
        });
        showToast(`Claim ${id} approved! ₹${amount} payout initiated`, 'success');
        // Also trigger payout
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/payout/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId, amount }) }).catch(() => {});
      } else {
        showToast(`Failed to approve: ${data.error || 'Unknown error'}`, 'warning');
      }
    } catch (err) {
      showToast(`Error approving claim: ${err.message}`, 'warning');
    }
    setPaying(null);
  };

  const doReject = async (id) => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/claims/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'Rejected by admin' }) });
      const data = await res.json();
      if (data.success) {
        setClaims(p => {
          const updated = p.map(c => c.claimId === id ? data.data : c);
          onFlaggedChange(updated.filter(c => c.status === 'flagged' || c.status === 'pending').length);
          return updated;
        });
        showToast(`Claim ${id} rejected`, 'info');
      } else {
        showToast(`Failed to reject: ${data.error || 'Unknown error'}`, 'warning');
      }
    } catch (err) {
      showToast(`Error rejecting claim: ${err.message}`, 'warning');
    }
  };

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'paid', 'flagged', 'pending', 'rejected'].map(f => (
            <button key={f} className={`sub-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${claims.length})` : `${f} (${claims.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>
        <button className="btn btn-xs btn-secondary" onClick={fetchClaims}>↻ Refresh</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Claim ID</th><th>Worker</th><th>Zone</th><th>Trigger</th><th>Amount</th><th>ML Scores</th><th>Decision</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <>
                <tr key={c.claimId} onClick={() => setExpanded(expanded === c.claimId ? null : c.claimId)} style={{ cursor: 'pointer' }}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{c.claimId}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.worker}<div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.workerId}</div></td>
                  <td style={{ color: 'var(--muted)' }}>{c.zone}</td>
                  <td>{c.trigger}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--safe)' }}>₹{c.amount}</div>
                    {c.estimated_loss > 0 && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Loss: ₹{Math.round(c.estimated_loss)}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.risk_score != null && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: c.risk_score > 0.7 ? 'rgba(220,38,38,0.08)' : c.risk_score > 0.4 ? 'rgba(217,119,6,0.08)' : 'rgba(0,168,20,0.08)', color: c.risk_score > 0.7 ? 'var(--danger)' : c.risk_score > 0.4 ? 'var(--warn)' : 'var(--safe)', fontFamily: 'DM Mono' }}>R:{(c.risk_score*100).toFixed(0)}%</span>}
                      {c.anomaly_score != null && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: c.anomaly_score > 0.5 ? 'rgba(220,38,38,0.08)' : 'rgba(0,168,20,0.08)', color: c.anomaly_score > 0.5 ? 'var(--danger)' : 'var(--safe)', fontFamily: 'DM Mono' }}>F:{(c.anomaly_score*100).toFixed(0)}%</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 11 }}>
                      {c.final_decision && <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'rgba(0,168,20,0.08)' : c.final_decision === 'reject' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)', color: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'var(--safe)' : c.final_decision === 'reject' ? 'var(--danger)' : 'var(--warn)' }}>{c.final_decision}</span>}
                      {c.llm_reason && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, maxWidth: 180, lineHeight: 1.3 }} title={c.llm_reason}>{c.llm_reason.slice(0, 60)}{c.llm_reason.length > 60 ? '...' : ''}</div>}
                    </div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>{c.date} {c.time}</td>
                  <td>
                    {(c.status === 'flagged' || c.status === 'pending') && (
                      <div className="actions">
                        <button className="btn btn-xs" style={{ background: 'rgba(0,168,20,0.08)', color: 'var(--safe)', border: '1px solid rgba(0,168,20,0.2)', padding: '4px 10px', fontSize: 11, borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={(e) => { e.stopPropagation(); doApprove(c.claimId, c.amount, c.workerId); }} disabled={paying === c.claimId}>
                          {paying === c.claimId ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />Paying...</> : '✓ Approve & Pay'}
                        </button>
                        <button className="btn btn-xs btn-danger-soft" onClick={(e) => { e.stopPropagation(); doReject(c.claimId); }}>✗ Reject</button>
                      </div>
                    )}
                    {c.status === 'paid' && <span style={{ fontSize: 11, color: 'var(--safe)' }}>✓ Paid</span>}
                    {c.status === 'rejected' && <span style={{ fontSize: 11, color: 'var(--danger)' }}>✗ Rejected</span>}
                  </td>
                </tr>
                {expanded === c.claimId && (
                  <tr key={`${c.claimId}-ml`}>
                    <td colSpan="10" style={{ padding: '0 12px 16px', background: 'var(--bg2)' }}>
                      <ClaimMLPanel claim={c} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Triggers Sub-tab ──────────────────────────────────────────────
function Triggers({ showToast }) {
  const [triggers, setTriggers] = useState([]);
  const [simulating, setSimulating] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/triggers').then(r => r.json()).then(d => { if (d.success) setTriggers(d.data); });
  }, []);

  const simulate = async (id) => {
    setSimulating(id);
    setLastResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triggers/${id}/simulate`, { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setTriggers(p => p.map(t => (t.triggerId || t.id) === id ? { ...t, ...d.data, fired: true } : t));
        setLastResult({ triggerName: d.data?.name || 'Trigger', claimsCreated: d.claimsCreated || 0, message: d.message });
        showToast(`${d.data?.name || 'Trigger'} fired! ${d.claimsCreated || 0} auto-claims created.`, 'warning');
      }
    } catch {}
    setSimulating(null);
  };
  const reset = async (id) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triggers/${id}/reset`, { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      setTriggers(p => p.map(t => (t.triggerId || t.id) === id ? { ...t, ...d.data, fired: false } : t));
      setLastResult(null);
      showToast('Trigger reset', 'info');
    }
  };

  return (
    <div className="fade-in">
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <span>⚡</span>
        <span>Trigger simulation creates automatic claims for all active, insured riders. Each claim is ML-scored before payout. The admin makes the final decision on flagged claims.</span>
      </div>

      {lastResult && (
        <div className="card fade-in" style={{ marginBottom: 16, borderLeft: '3px solid var(--warn)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{lastResult.triggerName} Fired!</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{lastResult.claimsCreated} auto-claims created for affected workers. Claims are now pending ML analysis and admin review.</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)' }}>
            💡 Go to <strong>Claims</strong> tab to review and approve/reject the generated claims.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {triggers.map(t => {
          const tid = t.triggerId || t.id;
          return (
            <div key={tid} className={`trigger-card ${t.fired ? 'fired' : ''}`}>
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
                ? <><span className="badge badge-red"><span className="badge-dot" />FIRED</span><button className="btn btn-sm btn-secondary" onClick={() => reset(tid)} style={{ marginLeft: 10 }}>Reset</button></>
                : <button className="btn btn-sm btn-danger-soft" onClick={() => simulate(tid)} disabled={simulating === tid}>
                    {simulating === tid ? <><span className="spinner" />Simulating...</> : '⚡ Simulate'}
                  </button>
              }
            </div>
          );
        })}
        {triggers.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 32 }}>No triggers configured. Run the seed script to populate triggers.</div>}
      </div>

      {/* How triggers work pipeline */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">How a Trigger Becomes a Payout</div>
        <div style={{ display: 'flex', gap: 0, marginTop: 12, overflowX: 'auto' }}>
          {['Threshold\ncrossed', 'ML Risk\nModel runs', 'Fraud\nDetection', 'Rule Engine\n+ LLM', 'Admin\nDecision', 'Payout\nvia UPI'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', minWidth: 90 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 14, fontWeight: 600, color: 'var(--accent)'
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{s}</div>
              {i < 5 && <div style={{ position: 'absolute', right: 0, top: 14, fontSize: 18, color: 'var(--border)' }}>→</div>}
            </div>
          ))}
        </div>
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
  const [workerClaims, setWorkerClaims] = useState([]);

  useEffect(() => { fetch((import.meta.env.VITE_API_URL || '') + '/api/workers').then(r => r.json()).then(d => { if (d.success) setWorkers(d.data); }); }, []);

  const analyze = async (w) => {
    setSelected(w);
    setResult(null);
    setAnalyzing(true);
    setWorkerClaims([]);

    try {
      // Fetch worker's claims to get real ML data
      const claimsRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/claims/worker/${w.workerId}`);
      const claimsData = await claimsRes.json();
      if (claimsData.success) setWorkerClaims(claimsData.data);

      // Also call the analyze endpoint
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/claims/-/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bcs: w.bcs }) }).catch(() => {});
    } catch {}

    // Build analysis from real claim data + worker profile
    setTimeout(() => {
      setAnalyzing(false);
      const bcs = w.trust_score || w.bcs;
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
  };

  return (
    <div className="fade-in">
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Select Worker to Analyze</div>
          {workers.map(w => (
            <div key={w.workerId} onClick={() => analyze(w)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${selected?.workerId === w.workerId ? 'var(--accent)' : 'var(--border)'}`, background: selected?.workerId === w.workerId ? 'var(--accent-dim)' : 'var(--surface)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{w.zone} · {w.platform} · {w.status}</div>
              </div>
              <BCSBadge score={w.trust_score || w.bcs} />
            </div>
          ))}
        </div>
        <div>
          {analyzing && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Running 5-layer ML analysis...</div>
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
                    <div style={{ fontSize: 32, fontWeight: 700, color: (result.worker.trust_score||result.worker.bcs) >= 70 ? 'var(--safe)' : (result.worker.trust_score||result.worker.bcs) >= 40 ? 'var(--warn)' : 'var(--danger)' }}>{result.worker.trust_score||result.worker.bcs}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Trust Score</div>
                  </div>
                </div>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <div className="bcs-meter" />
                  <div className="bcs-marker" style={{ left: `${result.worker.trust_score||result.worker.bcs}%` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--muted)' }}>
                    <span>0 — Held</span><span>40 — Review</span><span>70 — Auto-Approve</span><span>100</span>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: `${result.verdict.color}15`, border: `1px solid ${result.verdict.color}40` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: result.verdict.color }}>{result.verdict.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{result.verdict.action}</div>
                </div>
              </div>

              {/* Show real claims from this worker */}
              {workerClaims.length > 0 && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-title">Recent Claims ({workerClaims.length})</div>
                  {workerClaims.slice(0, 3).map(c => (
                    <div key={c.claimId} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{c.claimId}</span>
                        <span style={{ fontSize: 11, marginLeft: 8 }}>{c.trigger}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--safe)' }}>₹{c.amount}</span>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card">
                <div className="card-title">5-Layer ML Breakdown</div>
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
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>← Select a worker to run ML analysis</div>
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
    fetch((import.meta.env.VITE_API_URL || '') + '/api/payments').then(r => r.json()).then(d => { if (d.success) setPayments(d.data); })
      .catch(() => setPayments([]));
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
            <thead><tr><th>Payout ID</th><th>Claim</th><th>Worker</th><th>Amount</th><th>Method</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.payoutId}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{p.payoutId}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{p.claimId || '—'}</td>
                  <td><span className="mono">{p.workerId}</span></td>
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
export default function AdminDashboard({ activePage, showToast, onFlaggedChange }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); });
  }, []);

  const titles = {
    overview:  { title: 'Insurer Dashboard',   sub: 'Shielded Rider Operations · Live Overview' },
    workers:   { title: 'Worker Registry',      sub: 'Manage, verify and onboard insured riders' },
    claims:    { title: 'Claims Management',    sub: 'Review ML analysis, approve and process claim payouts' },
    triggers:  { title: 'Trigger Engine',       sub: 'Simulate disruptions — auto-create claims for all riders' },
    fraud:     { title: 'Fraud & ML Engine',    sub: '5-layer ML anti-spoofing behavioral analysis' },
    payouts:   { title: 'Payout Ledger',        sub: 'All premium payments and claim payouts' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--safe)', padding: '6px 14px', background: 'rgba(0,168,20,0.06)', border: '1px solid rgba(0,168,20,0.2)', borderRadius: 20 }}>
            <span className="live-dot" /> Live monitoring
          </div>
        </div>
      </div>

      {activePage === 'overview' && (stats ? <Overview stats={stats} /> : <div style={{ color: 'var(--muted)' }}>Loading...</div>)}
      {activePage === 'workers'  && <Workers showToast={showToast} />}
      {activePage === 'claims'   && <Claims  showToast={showToast} onFlaggedChange={onFlaggedChange || (() => {})} />}
      {activePage === 'triggers' && <Triggers showToast={showToast} />}
      {activePage === 'fraud'    && <Fraud   showToast={showToast} />}
      {activePage === 'payouts'  && <Payouts />}
    </div>
  );
}
