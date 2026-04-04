import { useState } from 'react';
import { WORKERS } from '../data/mockData';
import BCSBadge from '../components/BCSBadge';

export default function FraudPage() {
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = (worker) => {
    setSelected(worker);
    setResult(null);
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setResult(worker); }, 2200);
  };

  const getLayers = (bcs) => [
    { name: 'Movement Intelligence', score: bcs > 60 ? Math.min(bcs + 8, 98) : bcs - 10, pass: bcs > 60, detail: bcs > 60 ? 'Natural road-speed motion detected' : 'Static device — no movement pattern' },
    { name: 'Environmental Cross-Match', score: bcs > 60 ? Math.min(bcs + 5, 97) : bcs - 8, pass: bcs > 60, detail: bcs > 60 ? 'Rain intensity matches halt threshold' : 'Traffic API: clear roads contradict claim' },
    { name: 'Sensor & Behavioral Profile', score: bcs > 60 ? bcs - 3 : bcs - 12, pass: bcs > 60, detail: bcs > 60 ? 'Accelerometer consistent with sheltering' : 'Flat sensor data — no real movement' },
    { name: 'Fraud Ring Detection', score: bcs > 60 ? Math.min(bcs + 2, 96) : bcs - 5, pass: bcs > 40, detail: bcs > 40 ? 'No coordinated spike detected' : '3 claims from same device cluster' },
  ];

  const getVerdict = (bcs) => {
    if (bcs >= 70) return { text: 'Auto-Approved', color: 'var(--safe)', action: 'Payout within 5 minutes' };
    if (bcs >= 40) return { text: 'Soft Review', color: 'var(--warn)', action: 'Passive checks — payout within 2 hours' };
    return { text: 'Claim Held', color: 'var(--danger)', action: 'Location confirmation requested via WhatsApp' };
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title serif">Adversarial Defense & BCS Engine</div>
        <div className="page-subtitle">Behavioral Consistency Score — 4-layer anti-spoofing analysis</div>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Select Worker to Analyze</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WORKERS.map(w => (
              <div key={w.id} onClick={() => analyze(w)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${selected?.id === w.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected?.id === w.id ? 'rgba(0,212,168,0.05)' : 'var(--surface)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{w.zone} · {w.platform}</div>
                </div>
                <BCSBadge score={w.bcs} />
              </div>
            ))}
          </div>
        </div>

        <div>
          {analyzing && (
            <div className="card fade-in" style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Running 4-layer BCS analysis...</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Checking sensors · Cross-matching weather · Ring detection</div>
            </div>
          )}
          {result && !analyzing && (() => {
            const verdict = getVerdict(result.bcs);
            const layers = getLayers(result.bcs);
            return (
              <div className="fade-in">
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{result.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{result.zone} · Claim under review</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: result.bcs >= 70 ? 'var(--safe)' : result.bcs >= 40 ? 'var(--warn)' : 'var(--danger)' }}>{result.bcs}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>BCS Score</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <div className="bcs-meter" />
                    <div className="bcs-marker" style={{ left: `${result.bcs}%` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--muted)' }}>
                      <span>0 — Held</span><span>40 — Soft Review</span><span>70 — Auto-Approve</span><span>100</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: `${verdict.color}15`, border: `1px solid ${verdict.color}40`, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: verdict.color }}>{verdict.text}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{verdict.action}</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Layer-by-Layer Breakdown</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {layers.map((l, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>{l.pass ? '✅' : '🚩'}</span>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontFamily: 'DM Mono', color: l.pass ? 'var(--safe)' : 'var(--danger)' }}>{l.score}/100</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${l.score}%`, background: l.pass ? 'var(--safe)' : 'var(--danger)' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{l.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          {!result && !analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 14 }}>
              ← Select a worker to run BCS analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
