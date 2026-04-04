import React, { useState } from 'react';

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', city: '', zone: '', pincode: '', platform: '', earnings: '', plan: 'Standard' });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);

  const premiumMap = { Basic: 39, Standard: 59, Max: 89 };
  const payoutMap = { Basic: '₹900', Standard: '₹1,400', Max: '₹2,200' };
  const coverageMap = { Basic: '30%', Standard: '40%', Max: '55%' };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcPremium = () => {
    let base = premiumMap[form.plan] || 59;
    const zone = form.zone.toLowerCase();
    if (zone.includes('koramangala') || zone.includes('hsr')) base += 15;
    const m = new Date().getMonth();
    if (m >= 5 && m <= 8) base += 15;
    setQuote({ premium: base, payout: payoutMap[form.plan], coverage: coverageMap[form.plan], risk: base > 70 ? 'High' : 'Medium' });
  };

  const handleNext = () => {
    if (step === 2) calcPremium();
    if (step < 3) setStep(s => s + 1);
  };

  const handleActivate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onComplete(form, quote); }, 1800);
  };

  const steps = [{ n: 1, l: 'Profile' }, { n: 2, l: 'Location & Plan' }, { n: 3, l: 'Review & Activate' }];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title serif">Worker Onboarding</div>
        <div className="page-subtitle">Set up income protection in under 2 minutes</div>
      </div>

      <div className="steps">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
              <div className="step-num">{step > s.n ? '✓' : s.n}</div>
              <span className="step-label">{s.l}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: 560 }}>
        {step === 1 && (
          <div className="card fade-in">
            <div className="card-title">Personal Details</div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => f('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Platform</label>
              <select className="form-select" value={form.platform} onChange={e => f('platform', e.target.value)}>
                <option value="">Select platform</option>
                <option>Swiggy</option>
                <option>Zomato</option>
                <option>Blinkit</option>
                <option>Zepto</option>
                <option>Amazon Flex</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Average Weekly Earnings (₹)</label>
              <input className="form-input" type="number" placeholder="e.g. 4200" value={form.earnings} onChange={e => f('earnings', e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleNext} disabled={!form.name || !form.platform || !form.earnings}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card fade-in">
            <div className="card-title">Location & Coverage Plan</div>
            <div className="grid2" style={{ gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City</label>
                <select className="form-select" value={form.city} onChange={e => f('city', e.target.value)}>
                  <option value="">Select city</option>
                  <option>Bengaluru</option>
                  <option>Chennai</option>
                  <option>Mumbai</option>
                  <option>Hyderabad</option>
                  <option>Delhi NCR</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pin Code</label>
                <input className="form-input" placeholder="e.g. 560034" value={form.pincode} onChange={e => f('pincode', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Zone / Area</label>
              <input className="form-input" placeholder="e.g. Koramangala" value={form.zone} onChange={e => f('zone', e.target.value)} />
            </div>
            <div className="card-title" style={{ marginBottom: 12 }}>Coverage Plan</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {['Basic', 'Standard', 'Max'].map(p => (
                <div key={p} onClick={() => f('plan', p)} style={{
                  flex: 1, padding: '14px 10px', border: `2px solid ${form.plan === p ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  background: form.plan === p ? 'rgba(0,212,168,0.08)' : 'var(--surface2)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.plan === p ? 'var(--accent)' : 'var(--text)' }}>{p}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: '6px 0' }}>₹{premiumMap[p]}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>/wk</span></div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{coverageMap[p]} income</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Max {payoutMap[p]}/wk</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-full" onClick={handleNext} disabled={!form.city || !form.zone}>
              Get My Quote →
            </button>
          </div>
        )}

        {step === 3 && quote && (
          <div className="fade-in">
            <div className="alert alert-success">
              <span>✅</span>
              <span>Your AI risk profile is ready. Weekly premium calculated for <strong>{form.zone}, {form.city}</strong>.</span>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Your Policy Summary</div>
              <div style={{ display: 'flex', gap: 16, margin: '12px 0 16px' }}>
                <div style={{ textAlign: 'center', flex: 1, padding: 16, background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>WEEKLY PREMIUM</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>₹{quote.premium}</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, padding: 16, background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>MAX PAYOUT</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{quote.payout}</div>
                </div>
              </div>
              <div className="info-row"><span className="info-key">Name</span><span className="info-val">{form.name}</span></div>
              <div className="info-row"><span className="info-key">Platform</span><span className="info-val">{form.platform}</span></div>
              <div className="info-row"><span className="info-key">Zone</span><span className="info-val">{form.zone}, {form.city} — {form.pincode}</span></div>
              <div className="info-row"><span className="info-key">Plan</span><span className="info-val">{form.plan} ({quote.coverage} income covered)</span></div>
              <div className="info-row"><span className="info-key">Risk Level</span><span className="info-val" style={{ color: quote.risk === 'High' ? 'var(--danger)' : 'var(--warn)' }}>{quote.risk}</span></div>
              <div className="info-row"><span className="info-key">Declared Earnings</span><span className="info-val">₹{form.earnings}/week</span></div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Coverage is for <strong style={{ color: 'var(--text)' }}>income loss only</strong> due to parametric triggers (weather, AQI, curfew, outage). Health, accident, and vehicle repairs are excluded.
            </div>
            <button className="btn btn-primary btn-full" onClick={handleActivate} disabled={loading}>
              {loading ? <><span className="spinner" />Activating Policy...</> : '🛡️ Activate Policy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
