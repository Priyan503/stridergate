import { useState } from 'react';
import { TRIGGERS as INITIAL_TRIGGERS } from '../data/mockData';

export default function TriggersPage({ onClaim }) {
  const [triggers, setTriggers] = useState(INITIAL_TRIGGERS);
  const [simulating, setSimulating] = useState(null);
  const [lastFired, setLastFired] = useState(null);

  const simulate = (id) => {
    setSimulating(id);
    setTimeout(() => {
      setTriggers(p => p.map(t => t.id === id ? { ...t, fired: true, current: id === 'T1' ? '41.8mm' : id === 'T3' ? '423' : 'Active' } : t));
      setSimulating(null);
      setLastFired(id);
      if (onClaim) onClaim(id);
    }, 2000);
  };

  const reset = (id) => {
    setTriggers(p => p.map(t => t.id === id ? INITIAL_TRIGGERS.find(x => x.id === id) : t));
    setLastFired(null);
  };

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title serif">Parametric Trigger Engine</div>
          <div className="page-subtitle">Real-time monitoring across 5 disruption signals — polling every 15 minutes</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--safe)' }}>
          <span className="live-dot" /><span>LIVE</span>
        </div>
      </div>

      {lastFired && (
        <div className="alert alert-warn fade-in">
          <span>⚡</span>
          <span><strong>Trigger fired!</strong> Automated claims initiated for all active policyholders in the affected zone. Zero-touch payouts processing.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {triggers.map(t => (
          <div key={t.id} className={`trigger-card ${t.fired ? 'active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <span className="trigger-icon">{t.icon}</span>
              <div>
                <div className="trigger-name">{t.name}</div>
                <div className="trigger-threshold">{t.source} · Threshold: {t.threshold}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 20 }}>
              <div className="trigger-value" style={{ color: t.fired ? 'var(--danger)' : t.value / t.limit > 0.7 ? 'var(--warn)' : 'var(--text)' }}>{t.current}</div>
              {t.unit && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.unit}</div>}
            </div>
            {t.fired
              ? <>
                  <span className="badge badge-red" style={{ marginRight: 12 }}><span className="badge-dot" />FIRED</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => reset(t.id)}>Reset</button>
                </>
              : <button className="btn btn-sm" style={{ background: 'rgba(224,92,92,0.12)', color: 'var(--danger)', border: '1px solid rgba(224,92,92,0.25)' }}
                  onClick={() => simulate(t.id)} disabled={simulating === t.id}>
                  {simulating === t.id ? <><span className="spinner" />Simulating...</> : '⚡ Simulate'}
                </button>
            }
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">How a Trigger Becomes a Payout</div>
        <div style={{ display: 'flex', gap: 0, marginTop: 12, overflowX: 'auto' }}>
          {['Threshold crossed', 'Fraud engine runs BCS', 'Claim auto-created', 'Payout via UPI'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', minWidth: 120 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 14, fontWeight: 600, color: 'var(--accent)'
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{s}</div>
              {i < 3 && <div style={{ position: 'absolute', right: 0, top: 14, fontSize: 18, color: 'var(--border)' }}>→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
