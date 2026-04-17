import { WORKERS, CLAIMS, WEEKLY_DATA, DAYS } from '../data/mockData';
import BCSBadge from '../components/BCSBadge';
import StatusBadge from '../components/StatusBadge';

export default function AdminPage() {
  const maxBar = Math.max(...WEEKLY_DATA);
  const totalPolicies = WORKERS.length;
  const activeClaims = CLAIMS.filter(c => c.status === 'paid').length;
  const flaggedClaims = CLAIMS.filter(c => c.status === 'flagged').length;
  const totalPayout = CLAIMS.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title serif">Insurer Admin Dashboard</div>
          <div className="page-subtitle">Week of Mar 17–23, 2026 · Bengaluru cluster</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(0,212,168,0.08)', border: '1px solid rgba(0,212,168,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--safe)' }}>
          <span className="live-dot" /> Live monitoring
        </div>
      </div>

      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Policies', value: totalPolicies, change: '+2 this week', up: true, icon: '🛡️' },
          { label: 'Claims Processed', value: activeClaims, change: '₹' + totalPayout + ' paid out', up: true, icon: '✅' },
          { label: 'Flagged Claims', value: flaggedClaims, change: 'Under review', up: false, icon: '🚩' },
          { label: 'Loss Ratio', value: '34%', change: 'Healthy threshold <60%', up: true, icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Weekly Claims Volume</div>
          <div className="bar-chart" style={{ marginTop: 16 }}>
            {WEEKLY_DATA.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="bar" style={{ height: `${(v / maxBar) * 70}px`, background: i === 6 ? 'var(--accent)' : 'var(--surface2)', border: `1px solid ${i === 6 ? 'var(--accent)' : 'var(--border)'}`, width: '100%' }} />
                <div className="bar-label">{DAYS[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>Claims initiated this week · Sunday peak due to rain trigger</div>
        </div>

        <div className="card">
          <div className="card-title">7-Day Risk Forecast</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { zone: 'Koramangala, BLR', risk: 87, label: 'High' },
              { zone: 'Andheri East, MUM', risk: 72, label: 'High' },
              { zone: 'Anna Nagar, CHN', risk: 38, label: 'Low' },
              { zone: 'Banjara Hills, HYD', risk: 54, label: 'Medium' },
            ].map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span>{r.zone}</span>
                  <span style={{ fontFamily: 'DM Mono', color: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }}>{r.risk}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.risk}%`, background: r.risk > 70 ? 'var(--danger)' : r.risk > 50 ? 'var(--warn)' : 'var(--safe)' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Powered by Prophet model · Next 7 days</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>Recent Claims Log</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr>
              <th>Claim ID</th><th>Worker</th><th>Zone</th><th>Trigger</th><th>Amount</th><th>BCS Score</th><th>Status</th><th>Time</th>
            </tr></thead>
            <tbody>
              {CLAIMS.map(c => (
                <tr key={c.id}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{c.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.worker}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.zone}</td>
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
      </div>
    </div>
  );
}
