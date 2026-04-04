import { useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import TriggersPage from './pages/TriggersPage';
import FraudPage from './pages/FraudPage';
import ClaimsPage from './pages/ClaimsPage';
import AdminPage from './pages/AdminPage';
import Toast from './components/Toast';

export default function App() {
  const [tab, setTab] = useState('onboard');
  const [toast, setToast] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [pendingClaims, setPendingClaims] = useState(0);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const handleOnboardComplete = (form, quote) => {
    setRegistered(true);
    setTab('triggers');
    showToast(`Policy activated for ${form.name}! ₹${quote.premium}/week premium starts today.`, 'success');
  };

  const handleClaim = (triggerId) => {
    const names = { T1: 'Heavy Rain', T3: 'Severe AQI', T4: 'Curfew', T5: 'Platform Outage' };
    showToast(`${names[triggerId] || 'Disruption'} trigger fired! Auto-claims initiated for affected workers.`, 'warning');
    setPendingClaims(p => p + 1);
    setTimeout(() => showToast('BCS analysis complete. 3 claims auto-approved, 1 flagged for review.', 'info'), 3000);
  };

  const TABS = [
    { id: 'onboard', label: 'Onboarding' },
    { id: 'triggers', label: 'Triggers' },
    { id: 'fraud', label: 'Fraud / BCS' },
    { id: 'claims', label: 'Claims', badge: pendingClaims > 0 ? pendingClaims : null },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <>
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">🛡️</div>
          <span>GigShield</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>v1.0 · Phase 1 Demo</span>
        </div>
        <div className="nav-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}{t.badge && <span className="nav-badge">{t.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'onboard' && <OnboardingPage onComplete={handleOnboardComplete} />}
      {tab === 'triggers' && <TriggersPage onClaim={handleClaim} />}
      {tab === 'fraud' && <FraudPage />}
      {tab === 'claims' && <ClaimsPage />}
      {tab === 'admin' && <AdminPage />}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
