import { useState, useEffect, useCallback } from 'react';
import WeatherWidget from '../components/WeatherWidget';
import ZoneMap from '../components/ZoneMap';
import PaymentModal from '../components/PaymentModal';
import StatusBadge from '../components/StatusBadge';
import BCSBadge from '../components/BCSBadge';

// ── ML Pipeline Step Component ──────────────────────────────────────
function MLPipelineStep({ icon, label, score, status, detail, pass: passed }) {
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

// ── Claim Submission Modal ──────────────────────────────────────────
function ClaimModal({ worker, onClose, onSubmit }) {
  const [claimType, setClaimType] = useState('heavy_rain');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const claimTypes = [
    { value: 'heavy_rain', label: 'Heavy Rain', icon: '🌧️', desc: 'Rainfall > 25mm/3hr in your zone' },
    { value: 'extreme_heat', label: 'Extreme Heat', icon: '🌡️', desc: 'Temperature > 43°C in your zone' },
    { value: 'severe_aqi', label: 'Severe AQI', icon: '💨', desc: 'AQI > 400 in your zone' },
    { value: 'outage', label: 'Platform Outage', icon: '📵', desc: 'Delivery platform down > 2 hours' },
    { value: 'curfew', label: 'Local Curfew', icon: '🚧', desc: 'Zone flagged for curfew/shutdown' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker: worker.name,
          workerId: worker.workerId,
          zone: worker.zone,
          trigger: claimTypes.find(c => c.value === claimType)?.label || claimType,
          claim_type: claimType,
          reported_issue: notes || claimTypes.find(c => c.value === claimType)?.label,
          bcs: worker.trust_score || worker.bcs,
          gps_lat: worker.lat,
          gps_lng: worker.lng,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSubmit(data);
      } else {
        alert(data.error || 'Claim submission failed');
      }
    } catch (err) {
      alert('Could not connect to server. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-title">📋 File a New Claim</div>
        <div className="modal-sub">Select the disruption type affecting your zone. Your claim will be processed by our ML engine.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {claimTypes.map(ct => (
            <div key={ct.value} onClick={() => setClaimType(ct.value)} style={{
              padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${claimType === ct.value ? 'var(--accent)' : 'var(--border)'}`,
              background: claimType === ct.value ? 'var(--accent-dim)' : 'var(--surface)',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>{ct.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: claimType === ct.value ? 'var(--accent)' : 'var(--text)' }}>{ct.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{ct.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Additional Notes (Optional)</label>
          <input className="form-input" placeholder="e.g. Heavy flooding near my route, couldn't take orders for 3 hours" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <span>🤖</span>
          <span>Your claim will be automatically analyzed by our Risk Model (XGBoost), Fraud Detection (IsolationForest), and Weather Verification. The admin will make the final decision.</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner" /> Submitting...</> : '📋 Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Claim ML Analysis Expandable ────────────────────────────────────
function ClaimMLDetails({ claim }) {
  const ml = claim.ml_analysis;
  if (!ml && !claim.risk_score) return null;

  const riskScore = ml?.risk_model?.score ?? claim.risk_score;
  const anomalyScore = ml?.fraud_model?.anomaly_score ?? claim.anomaly_score;
  const weatherMismatch = ml?.weather_check?.mismatch ?? false;

  return (
    <div className="ml-pipeline fade-in" style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>ML Analysis Pipeline</div>
      <div className="ml-steps">
        <MLPipelineStep
          label="Risk Model (XGBoost)"
          score={riskScore}
          status={ml?.risk_model?.status || (riskScore != null ? 'completed' : 'unavailable')}
          pass={riskScore != null && riskScore < 0.5}
          detail={riskScore > 0.7 ? 'High disruption risk detected' : riskScore > 0.4 ? 'Moderate risk — verification needed' : 'Low risk — likely legitimate'}
        />
        <div className="ml-step-connector" />
        <MLPipelineStep
          label="Fraud Detection (IsolationForest)"
          score={anomalyScore}
          status={ml?.fraud_model?.status || (anomalyScore != null ? 'completed' : 'unavailable')}
          pass={anomalyScore != null && anomalyScore < 0.5}
          detail={anomalyScore > 0.7 ? 'Anomalous pattern detected' : anomalyScore > 0.4 ? 'Borderline — needs review' : 'Normal behavioral pattern'}
        />
        <div className="ml-step-connector" />
        <MLPipelineStep
          label="Weather Verification"
          score={weatherMismatch ? 'MISMATCH' : 'MATCH'}
          status="completed"
          pass={!weatherMismatch}
          detail={ml?.weather_check?.actual_conditions ? `Actual: ${ml.weather_check.actual_conditions}` : (claim.weather_snapshot?.condition || 'Weather data available')}
        />
        <div className="ml-step-connector" />
        <MLPipelineStep
          label="Rule Engine"
          score={ml?.rule_engine?.decision || claim.final_decision}
          status="completed"
          pass={['approve', 'auto_approve'].includes(ml?.rule_engine?.decision || claim.final_decision)}
          detail={ml?.rule_engine?.reason || claim.decision_reason || ''}
        />
        {(ml?.llm_reasoning || claim.llm_reason) && (
          <>
            <div className="ml-step-connector" />
            <MLPipelineStep
              label="LLM Reasoning (GPT-4o)"
              score={ml?.llm_reasoning?.llm_used ? `${((ml?.llm_reasoning?.confidence || 0) * 100).toFixed(0)}% conf` : 'Skipped'}
              status={ml?.llm_reasoning?.llm_used ? 'completed' : 'unavailable'}
              pass={['approve'].includes(ml?.llm_reasoning?.decision || claim.llm_decision)}
              detail={ml?.llm_reasoning?.reason || claim.llm_reason || 'LLM not invoked for this claim'}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkerDashboard({ worker: initialWorker, activePage, showToast }) {
  const [worker, setWorker]     = useState(initialWorker);
  const [claims, setClaims]     = useState([]);
  const [pricing, setPricing]   = useState(null);
  const [showPay, setShowPay]   = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState(null);

  const fetchClaims = useCallback(() => {
    if (!worker?.workerId) return;
    fetch(`/api/claims/worker/${worker.workerId}`)
      .then(r => r.json()).then(d => { if (d.success) setClaims(d.data); }).catch(() => {});
  }, [worker?.workerId]);

  useEffect(() => {
    if (!initialWorker?.workerId) return;
    const wid = initialWorker.workerId;
    // Fetch worker's own data
    fetch(`/api/workers/${wid}`)
      .then(r => r.json()).then(d => { if (d.success) setWorker(d.data); }).catch(() => {});
    // Fetch claims
    fetchClaims();
    // Fetch pricing breakdown
    fetch(`/api/workers/${wid}/pricing`)
      .then(r => r.json()).then(d => { if (d.success) setPricing(d.data.pricing?.legacy || d.data.pricing); }).catch(() => {});
  }, [initialWorker?.workerId]);

  // Auto-refresh claims every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchClaims, 30000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  if (!worker) return <div className="page"><div style={{ color: 'var(--muted)' }}>Loading...</div></div>;

  const paid    = claims.filter(c => c.status === 'paid');
  const flagged = claims.filter(c => c.status === 'flagged' || c.status === 'pending');
  const totalPaid = paid.reduce((s, c) => s + c.amount, 0);

  const trustScore = worker.trust_score || worker.bcs;
  const bcsColor = trustScore >= 70 ? 'var(--safe)' : trustScore >= 40 ? 'var(--warn)' : 'var(--danger)';
  const bcsVerdict = trustScore >= 70 ? 'Trusted Rider' : trustScore >= 40 ? 'Under Review' : 'High Risk';

  const handleClaimSubmitted = (data) => {
    setShowClaim(false);
    fetchClaims();
    const status = data.data?.status || 'pending';
    const decision = data.ml?.decision || 'pending';
    showToast(`Claim submitted! ML Decision: ${decision} (Status: ${status})`, status === 'paid' ? 'success' : 'info');
  };

  // ── SINGLE RETURN with conditional rendering ────────────────────
  return (
    <>
      {/* ── Dashboard Page ──────────────────────────────────────────── */}
      {activePage === 'dashboard' && (
        <div className="page fade-in">
          <div className="top-bar">
            <div>
              <div className="page-title serif">Welcome back, {worker.name.split(' ')[0]}! 👋</div>
              <div className="page-subtitle">{worker.platform} · {worker.zone}, {worker.city} · {worker.plan} Plan</div>
            </div>
            <div className="top-bar-right">
              {worker.verified
                ? <span className="verified-chip yes">✓ Verified</span>
                : <span className="verified-chip no">⏳ Pending Verification</span>}
              <button className="btn btn-primary btn-sm" onClick={() => setShowClaim(true)}>📋 File Claim</button>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowPay(true)}>💳 Pay Premium</button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Trust Score',    value: trustScore,              sub: bcsVerdict,            color: bcsColor,       icon: '🛡️' },
              { label: 'Weekly Premium', value: `₹${worker.premium_amount || worker.premium}`,  sub: `${worker.plan} Plan`, color: 'var(--text)',  icon: '💳' },
              { label: 'Total Received', value: `₹${totalPaid}`,       sub: `${paid.length} claims paid`, color: 'var(--safe)', icon: '💰' },
              { label: 'Pending Claims', value: flagged.length,          sub: 'Under review',        color: flagged.length > 0 ? 'var(--warn)' : 'var(--text)', icon: '📋' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="stat-label">{s.label}</div>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
                <div className="stat-change up">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid2" style={{ marginBottom: 20 }}>
            {/* BCS Score detail */}
            <div className="card">
              <div className="card-title">Your Trust Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '12px 0 16px' }}>
                <div className="iss-ring" style={{ borderColor: bcsColor }}>
                  <div className="iss-val" style={{ color: bcsColor }}>{trustScore}</div>
                  <div className="iss-label">Trust</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: bcsColor, marginBottom: 4 }}>{bcsVerdict}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {trustScore >= 70 ? 'Your claims are auto-approved by AI within 5 minutes. Keep up the good work!' :
                     trustScore >= 40 ? 'Your claims go through ML-powered soft review (up to 2 hours). Maintain consistent activity to improve.' :
                     'Your claims require manual verification due to risk signals. A movement challenge may be issued.'}
                  </div>
                  {worker.trust_level && <div style={{ marginTop: 6 }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: worker.trust_level === 'trusted' ? 'rgba(0,212,168,0.1)' : worker.trust_level === 'flagged' ? 'rgba(224,92,92,0.1)' : 'rgba(120,120,120,0.1)', color: worker.trust_level === 'trusted' ? 'var(--safe)' : worker.trust_level === 'flagged' ? 'var(--danger)' : 'var(--muted)' }}>{worker.trust_level}</span></div>}
                </div>
              </div>
              <div className="bcs-meter">
                <div className="bcs-marker" style={{ left: `${trustScore}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--muted)' }}>
                <span>0 — Held</span><span>40 — Review</span><span>70 — Auto-Approve</span><span>100</span>
              </div>
            </div>

            {/* ISS / Pricing */}
            <div className="card">
              <div className="card-title">Income Stability Score (ISS)</div>
              {pricing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0 16px' }}>
                    <div className="iss-ring">
                      <div className="iss-val">{pricing.iss}</div>
                      <div className="iss-label">ISS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                        ISS = (Avg Orders × Consistency × Rating × Active Hours × Risk Factor)
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--safe)' }}>High ISS → Lower premium</span> &nbsp;•&nbsp;
                        <span style={{ color: 'var(--danger)' }}>Low ISS → Higher premium</span>
                      </div>
                    </div>
                  </div>
                  <div className="pricing-box">
                    <div className="pricing-row"><span>Base Premium</span><span>₹{pricing.breakdown.basePremium}</span></div>
                    <div className="pricing-row"><span>Zone Risk</span><span>+₹{pricing.breakdown.zoneRiskSurcharge}</span></div>
                    <div className="pricing-row"><span>Monsoon</span><span>+₹{pricing.breakdown.monsoonSurcharge}</span></div>
                    <div className="pricing-row"><span>BCS Adjustment</span><span style={{ color: 'var(--safe)' }}>{pricing.breakdown.bcsAdjustment}</span></div>
                    <div className="pricing-row total"><span>Final Premium</span><span style={{ color: 'var(--accent)' }}>₹{pricing.premium}</span></div>
                  </div>
                </>
              ) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading pricing...</div>}
            </div>
          </div>

          {/* Recent Claims */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Recent Claims</div>
              <button className="btn btn-primary btn-xs" onClick={() => setShowClaim(true)}>+ File Claim</button>
            </div>
            {claims.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>No claims yet. Click "File Claim" to submit your first claim, or claims will be auto-created when a parametric trigger fires.</div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <table className="table">
                  <thead><tr><th>Claim ID</th><th>Trigger</th><th>Amount</th><th>ML Decision</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {claims.slice(0, 5).map(c => (
                      <tr key={c.claimId} onClick={() => setExpandedClaim(expandedClaim === c.claimId ? null : c.claimId)} style={{ cursor: 'pointer' }}>
                        <td><span className="mono" style={{ fontSize: 12 }}>{c.claimId}</span></td>
                        <td>{c.trigger}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--safe)' }}>₹{c.amount}</div>
                          {c.estimated_loss > 0 && <div style={{ fontSize: 10, color: 'var(--muted)' }}>Est. loss: ₹{Math.round(c.estimated_loss)}</div>}
                        </td>
                        <td>
                          {c.final_decision && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'rgba(0,212,168,0.1)' : c.final_decision === 'reject' ? 'rgba(224,92,92,0.1)' : 'rgba(245,166,35,0.1)', color: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'var(--safe)' : c.final_decision === 'reject' ? 'var(--danger)' : 'var(--warn)' }}>{c.final_decision}</span>}
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                        <td style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>{c.date} {c.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── My Policy Page ────────────────────────────────────────── */}
      {activePage === 'my-policy' && (
        <div className="page fade-in">
          <div className="page-header">
            <div className="page-title serif">My Policy</div>
            <div className="page-subtitle">Your active insurance coverage details</div>
          </div>
          <div className="grid2" style={{ alignItems: 'start' }}>
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-title">Policy Details</div>
                <div style={{ marginTop: 10 }}>
                  {[
                    ['Policy ID',      worker.workerId],
                    ['Name',           worker.name],
                    ['Platform',       worker.platform],
                    ['City',           worker.city],
                    ['Zone',           worker.zone],
                    ['PIN Code',       worker.pincode],
                    ['Plan',           worker.plan],
                    ['Status',         null, <StatusBadge key="s" status={worker.status} />],
                    ['Verified',       null, worker.verified ? <span key="v" className="verified-chip yes">✓ Verified</span> : <span key="v" className="verified-chip no">Pending</span>],
                    ['Weekly Premium', `₹${worker.premium}`],
                    ['Max Payout',     `₹${pricing?.maxPayout || 1400}/week`],
                    ['Joined',         worker.joined],
                  ].map(([k, v, el]) => (
                    <div key={k} className="info-row">
                      <span className="info-key">{k}</span>
                      {el || <span className="info-val">{v}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => setShowPay(true)}>💳 Pay This Week's Premium</button>
            </div>

            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-title">Coverage Summary</div>
                <div style={{ display: 'flex', gap: 12, margin: '12px 0 16px' }}>
                  {[
                    { label: 'Coverage', value: `${pricing?.coveragePercent || 40}%`, sub: 'of lost income' },
                    { label: 'Max Payout', value: `₹${pricing?.maxPayout || 1400}`, sub: 'per week' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 16, background: 'var(--surface2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="alert alert-info" style={{ marginBottom: 0 }}>
                  <span>ℹ️</span>
                  <span>Coverage applies for income loss due to parametric triggers: heavy rain, extreme heat, severe AQI, curfew, or platform outage. Health and accidents excluded.</span>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Policy Exclusions</div>
                {['War or terrorism', 'Government lockdowns', 'Nuclear or biological events', 'Proven GPS spoofing or fraud'].map(e => (
                  <div key={e} style={{ display: 'flex', gap: 10, padding: '7px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--danger)' }}>✗</span>
                    <span className="info-key">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── My Claims Page ────────────────────────────────────────── */}
      {activePage === 'my-claims' && (
        <div className="page fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div className="page-title serif">My Claims</div>
              <div className="page-subtitle">Auto-processed claim history for {worker.name}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowClaim(true)}>📋 File a Claim</button>
          </div>
          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Claims Yet</div>
              <div style={{ color: 'var(--muted)', marginBottom: 20 }}>File your first claim when a disruption affects your zone, or claims will be auto-created when parametric triggers fire.</div>
              <button className="btn btn-primary" onClick={() => setShowClaim(true)}>📋 File Your First Claim</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claims.map(c => (
                <div key={c.claimId} className="card" style={{ borderLeft: `3px solid ${c.status === 'paid' ? 'var(--safe)' : c.status === 'flagged' || c.status === 'pending' ? 'var(--warn)' : 'var(--danger)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{c.claimId}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge status={c.status} />
                      <button className="btn btn-xs btn-secondary" onClick={() => setExpandedClaim(expandedClaim === c.claimId ? null : c.claimId)}>
                        {expandedClaim === c.claimId ? '▲ Hide ML' : '▼ Show ML'}
                      </button>
                    </div>
                  </div>
                  <div className="grid2" style={{ gap: 8 }}>
                    {[['Trigger', c.trigger],['Zone', c.zone],['Amount', `₹${c.amount}`],['Date', `${c.date} ${c.time}`]].map(([k, v]) => (
                      <div key={k} className="info-row"><span className="info-key">{k}</span><span className="info-val" style={k === 'Amount' ? { color: 'var(--safe)', fontWeight: 700 } : {}}>{v}</span></div>
                    ))}
                  </div>
                  {/* ML scores row */}
                  {(c.risk_score != null || c.estimated_loss > 0) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {c.risk_score != null && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontFamily: 'DM Mono' }}>Risk: {(c.risk_score*100).toFixed(0)}%</span>}
                      {c.anomaly_score != null && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: c.anomaly_score > 0.5 ? 'rgba(224,92,92,0.1)' : 'rgba(0,212,168,0.1)', color: c.anomaly_score > 0.5 ? 'var(--danger)' : 'var(--safe)', fontFamily: 'DM Mono' }}>Fraud: {(c.anomaly_score*100).toFixed(0)}%</span>}
                      {c.estimated_loss > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontFamily: 'DM Mono' }}>Est. Loss: ₹{Math.round(c.estimated_loss)}</span>}
                    </div>
                  )}
                  {/* Expanded ML Analysis */}
                  {expandedClaim === c.claimId && <ClaimMLDetails claim={c} />}
                  {/* LLM explanation */}
                  {c.llm_reason && c.llm_decision !== 'skip' && expandedClaim !== c.claimId && (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, borderLeft: '3px solid var(--accent)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 6 }}>AI Insight:</span>{c.llm_reason}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    {c.final_decision && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'rgba(0,212,168,0.1)' : c.final_decision === 'reject' ? 'rgba(224,92,92,0.1)' : 'rgba(245,166,35,0.1)', color: c.final_decision === 'approve' || c.final_decision === 'auto_approve' ? 'var(--safe)' : c.final_decision === 'reject' ? 'var(--danger)' : 'var(--warn)' }}>{c.final_decision}</span>}
                    {(c.status === 'flagged' || c.status === 'pending') && (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Under review — awaiting admin decision</span>
                    )}
                    {c.status === 'paid' && (
                      <span style={{ fontSize: 12, color: 'var(--safe)' }}>✓ Paid to your UPI account</span>
                    )}
                    {c.status === 'rejected' && (
                      <span style={{ fontSize: 12, color: 'var(--danger)' }}>✗ {c.adminNote || c.decision_reason || 'Rejected — contact support'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Weather Page ──────────────────────────────────────────── */}
      {activePage === 'weather' && (
        <div className="page fade-in">
          <div className="page-header">
            <div className="page-title serif">My Zone Weather</div>
            <div className="page-subtitle">Live conditions for {worker.zone}, {worker.city} — refreshes every 5 minutes</div>
          </div>
          <div className="grid2" style={{ alignItems: 'start', marginBottom: 20 }}>
            <WeatherWidget city={worker.city} />
            <div className="card">
              <div className="card-title">Trigger Thresholds</div>
              {[
                { name: 'Heavy Rain',    threshold: '> 25mm / 3hr',  icon: '🌧️', param: 'rainfall' },
                { name: 'Extreme Heat',  threshold: '> 43°C',        icon: '🌡️', param: 'temp' },
                { name: 'Severe AQI',    threshold: '> 400 AQI',     icon: '💨', param: 'aqi' },
                { name: 'Platform Outage',threshold: '> 2hr downtime',icon: '📵', param: 'mock' },
              ].map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Threshold: {t.threshold}</div>
                  </div>
                  <span className="badge badge-blue">Auto-trigger</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Your Zone Map</div>
            <div style={{ marginTop: 12 }}>
              <ZoneMap city={worker.city} zone={worker.zone} workerName={worker.name} />
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Premium Page ──────────────────────────────────────── */}
      {activePage === 'pay' && (
        <div className="page fade-in">
          <div className="page-header">
            <div className="page-title serif">Pay Premium</div>
            <div className="page-subtitle">Secure weekly premium payment via Razorpay</div>
          </div>
          <div style={{ maxWidth: 480 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Payment Summary</div>
              <div className="payment-amount" style={{ margin: '12px 0' }}>
                <div className="payment-amount-val">₹{worker.premium}</div>
                <div className="payment-amount-label">{worker.plan} Plan · Weekly Premium</div>
              </div>
              {pricing && (
                <div className="pricing-box">
                  <div className="pricing-row"><span>Base Premium</span><span>₹{pricing.breakdown.basePremium}</span></div>
                  <div className="pricing-row"><span>Zone Risk Surcharge</span><span>+₹{pricing.breakdown.zoneRiskSurcharge}</span></div>
                  <div className="pricing-row"><span>Monsoon Surcharge</span><span>+₹{pricing.breakdown.monsoonSurcharge}</span></div>
                  <div className="pricing-row"><span>BCS Adjustment</span><span style={{ color: 'var(--safe)' }}>{pricing.breakdown.bcsAdjustment}</span></div>
                  <div className="pricing-row total"><span>Total Due</span><span style={{ color: 'var(--accent)' }}>₹{pricing.premium}</span></div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" style={{ fontSize: 15, padding: '14px' }} onClick={() => setShowPay(true)}>
              💳 Pay ₹{worker.premium} via Razorpay →
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
              🔒 Secured by Razorpay · Test Mode · No real charges
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {showPay && <PaymentModal worker={worker} onClose={() => setShowPay(false)}
        onSuccess={(ref) => { setShowPay(false); showToast(`₹${worker.premium} premium paid! Ref: ${ref}`, 'success'); }} />}
      {showClaim && <ClaimModal worker={worker} onClose={() => setShowClaim(false)} onSubmit={handleClaimSubmitted} />}
    </>
  );
}
