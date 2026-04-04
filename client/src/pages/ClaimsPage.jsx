import { useState } from 'react';
import { CLAIMS } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import BCSBadge from '../components/BCSBadge';

export default function ClaimsPage() {
  const [active, setActive] = useState(CLAIMS[0]);

  const steps = [
    { id: 'trigger', label: 'Trigger detected', sub: 'OpenWeatherMap — 41.8mm/3hr', done: true },
    { id: 'bcs', label: 'BCS analysis complete', sub: `Score: ${active.bcs} — ${active.bcs >= 70 ? 'Auto-approved' : active.bcs >= 40 ? 'Soft review' : 'Held'}`, done: true },
    { id: 'claim', label: 'Claim auto-created', sub: `${active.id} · ${active.trigger}`, done: true },
    { id: 'payout', label: 'Payout processed', sub: `₹${active.amount} → UPI (Razorpay sandbox)`, done: active.status === 'paid' },
    { id: 'notify', label: 'Worker notified', sub: 'Push notification + WhatsApp confirmation', done: active.status === 'paid' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title serif">Claims Management</div>
        <div className="page-subtitle">Zero-touch automated claim processing pipeline</div>
      </div>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Recent Claims</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CLAIMS.map(c => (
              <div key={c.id} onClick={() => setActive(c)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${active?.id === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: active?.id === c.id ? 'rgba(0,212,168,0.05)' : 'var(--surface)',
                  transition: 'all 0.2s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{c.id}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.worker}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                  <span>{c.trigger}</span>
                  <span style={{ color: 'var(--safe)', fontWeight: 600 }}>₹{c.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {active && (
          <div className="fade-in">
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{active.id}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{active.date} · {active.time}</div>
                </div>
                <StatusBadge status={active.status} />
              </div>
              <div className="info-row"><span className="info-key">Worker</span><span className="info-val">{active.worker}</span></div>
              <div className="info-row"><span className="info-key">Zone</span><span className="info-val">{active.zone}</span></div>
              <div className="info-row"><span className="info-key">Trigger</span><span className="info-val">{active.trigger}</span></div>
              <div className="info-row"><span className="info-key">Payout Amount</span><span className="info-val" style={{ color: 'var(--safe)', fontWeight: 700 }}>₹{active.amount}</span></div>
              <div className="info-row"><span className="info-key">BCS Score</span><span><BCSBadge score={active.bcs} /></span></div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Processing Timeline</div>
              <div className="timeline">
                {steps.map((s, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${s.done ? 'done' : i === steps.findIndex(x => !x.done) ? 'pending' : ''}`} />
                    <div className="timeline-title" style={{ color: s.done ? 'var(--text)' : 'var(--muted)' }}>{s.label}</div>
                    <div className="timeline-time">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {active.status === 'flagged' && (
              <div className="alert alert-warn fade-in" style={{ marginTop: 16 }}>
                <span>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Soft Review — BCS {active.bcs}</div>
                  <div style={{ fontSize: 12 }}>Passive checks running. Payout within 2 hours if verified. Worker notified with neutral message.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
