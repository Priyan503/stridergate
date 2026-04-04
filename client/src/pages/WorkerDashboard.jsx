import { useState, useEffect } from 'react';
import WeatherWidget from '../components/WeatherWidget';
import ZoneMap from '../components/ZoneMap';
import PaymentModal from '../components/PaymentModal';
import StatusBadge from '../components/StatusBadge';
import BCSBadge from '../components/BCSBadge';

export default function WorkerDashboard({ worker: initialWorker, activePage, showToast }) {
  const [worker, setWorker]     = useState(initialWorker);
  const [claims, setClaims]     = useState([]);
  const [pricing, setPricing]   = useState(null);
  const [showPay, setShowPay]   = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!worker?.workerId) return;
    // Fetch worker's own data
    fetch(`/api/workers/${worker.workerId}`)
      .then(r => r.json()).then(d => { if (d.success) setWorker(d.data); }).catch(() => {});
    // Fetch claims
    fetch(`/api/claims/worker/${worker.workerId}`)
      .then(r => r.json()).then(d => { if (d.success) setClaims(d.data); }).catch(() => {});
    // Fetch pricing breakdown
    fetch(`/api/workers/${worker.workerId}/pricing`)
      .then(r => r.json()).then(d => { if (d.success) setPricing(d.data.pricing); }).catch(() => {});
  }, [worker?.workerId]);

  if (!worker) return <div className="page"><div style={{ color: 'var(--muted)' }}>Loading...</div></div>;

  const paid    = claims.filter(c => c.status === 'paid');
  const flagged = claims.filter(c => c.status === 'flagged' || c.status === 'pending');
  const totalPaid = paid.reduce((s, c) => s + c.amount, 0);

  const bcsColor = worker.bcs >= 70 ? 'var(--safe)' : worker.bcs >= 40 ? 'var(--warn)' : 'var(--danger)';
  const bcsVerdict = worker.bcs >= 70 ? 'Trusted Rider' : worker.bcs >= 40 ? 'Under Review' : 'High Risk';

  // ── My Dashboard ──────────────────────────────────────────────
  if (activePage === 'dashboard') return (
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
          <button className="btn btn-primary btn-sm" onClick={() => setShowPay(true)}>💳 Pay Premium</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: 'BCS Score',      value: worker.bcs,            sub: bcsVerdict,            color: bcsColor,       icon: '🛡️' },
          { label: 'Weekly Premium', value: `₹${worker.premium}`,  sub: `${worker.plan} Plan`, color: 'var(--text)',  icon: '💳' },
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
          <div className="card-title">Your Trust Score (BCS)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '12px 0 16px' }}>
            <div className="iss-ring" style={{ borderColor: bcsColor }}>
              <div className="iss-val" style={{ color: bcsColor }}>{worker.bcs}</div>
              <div className="iss-label">BCS</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: bcsColor, marginBottom: 4 }}>{bcsVerdict}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                {worker.bcs >= 70 ? 'Your claims are auto-approved within 5 minutes. Keep up the good work!' :
                 worker.bcs >= 40 ? 'Your claims go through soft review (up to 2 hours). Maintain consistent activity to improve.' :
                 'Your claims require manual verification. A movement challenge may be issued.'}
              </div>
            </div>
          </div>
          <div className="bcs-meter">
            <div className="bcs-marker" style={{ left: `${worker.bcs}%` }} />
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
        <div className="card-title">Recent Claims</div>
        {claims.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>No claims yet. Claims are auto-created when a parametric trigger fires.</div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table className="table">
              <thead><tr><th>Claim ID</th><th>Trigger</th><th>Amount</th><th>BCS</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {claims.slice(0, 5).map(c => (
                  <tr key={c.claimId}>
                    <td><span className="mono" style={{ fontSize: 12 }}>{c.claimId}</span></td>
                    <td>{c.trigger}</td>
                    <td style={{ fontWeight: 600, color: 'var(--safe)' }}>₹{c.amount}</td>
                    <td><BCSBadge score={c.bcs} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--muted)', fontFamily: 'DM Mono', fontSize: 12 }}>{c.date} {c.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPay && <PaymentModal worker={worker} onClose={() => setShowPay(false)}
        onSuccess={(ref) => { setShowPay(false); showToast(`₹${worker.premium} premium paid! Ref: ${ref}`, 'success'); }} />}
    </div>
  );

  // ── My Policy Page ────────────────────────────────────────────
  if (activePage === 'my-policy') return (
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
      {showPay && <PaymentModal worker={worker} onClose={() => setShowPay(false)} onSuccess={(ref) => { setShowPay(false); showToast(`₹${worker.premium} paid! Ref: ${ref}`, 'success'); }} />}
    </div>
  );

  // ── My Claims Page ────────────────────────────────────────────
  if (activePage === 'my-claims') return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title serif">My Claims</div>
        <div className="page-subtitle">Auto-processed claim history for {worker.name}</div>
      </div>
      {claims.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          No claims yet. Claims are automatically created when a weather or disruption trigger fires in your zone.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {claims.map(c => (
            <div key={c.claimId} className="card" style={{ borderLeft: `3px solid ${c.status === 'paid' ? 'var(--safe)' : c.status === 'flagged' ? 'var(--warn)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{c.claimId}</span>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid2" style={{ gap: 8 }}>
                {[['Trigger', c.trigger],['Zone', c.zone],['Amount', `₹${c.amount}`],['Date', `${c.date} ${c.time}`]].map(([k, v]) => (
                  <div key={k} className="info-row"><span className="info-key">{k}</span><span className="info-val" style={k === 'Amount' ? { color: 'var(--safe)', fontWeight: 700 } : {}}>{v}</span></div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <BCSBadge score={c.bcs} />
                {c.status === 'flagged' && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Under review — movement verification in progress</span>
                )}
                {c.status === 'paid' && (
                  <span style={{ fontSize: 12, color: 'var(--safe)' }}>✓ Paid to your UPI account</span>
                )}
                {c.status === 'rejected' && (
                  <span style={{ fontSize: 12, color: 'var(--danger)' }}>✗ {c.adminNote || 'Rejected — contact support'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Weather Page ──────────────────────────────────────────────
  if (activePage === 'weather') return (
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
  );

  // ── Pay Premium Page ──────────────────────────────────────────
  if (activePage === 'pay') return (
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
      {showPay && <PaymentModal worker={worker} onClose={() => setShowPay(false)} onSuccess={(ref) => { setShowPay(false); showToast(`₹${worker.premium} paid! Ref: ${ref}`, 'success'); }} />}
    </div>
  );

  return null;
}
