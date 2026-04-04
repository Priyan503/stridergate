export default function Sidebar({ role, user, activePage, onNavigate, onLogout, flaggedCount = 0 }) {
  const workerNav = [
    { id: 'dashboard',  icon: '📊', label: 'Dashboard'     },
    { id: 'my-policy',  icon: '🛡️', label: 'My Policy'     },
    { id: 'my-claims',  icon: '📋', label: 'My Claims'     },
    { id: 'weather',    icon: '🌤️', label: 'My Zone Weather'},
    { id: 'pay',        icon: '💳', label: 'Pay Premium'   },
  ];

  const adminNav = [
    { id: 'overview',  icon: '📊', label: 'Overview'    },
    { id: 'workers',   icon: '👥', label: 'Workers'     },
    { id: 'claims',    icon: '📋', label: 'Claims', badge: flaggedCount || null },
    { id: 'triggers',  icon: '⚡', label: 'Triggers'    },
    { id: 'fraud',     icon: '🔍', label: 'Fraud / BCS' },
    { id: 'payouts',   icon: '💸', label: 'Payouts'     },
  ];

  const nav = role === 'admin' ? adminNav : workerNav;
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛡️</div>
        <div>
          <div className="sidebar-logo-text">GigShield</div>
          <div className="sidebar-logo-ver">v2.0 · Demo</div>
        </div>
      </div>

      <div className={`sidebar-role ${role}`}>
        {role === 'admin' ? '🏢 Admin Panel' : '🏍️ Rider Portal'}
      </div>

      <div className="sidebar-nav">
        {nav.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{role === 'admin' ? 'Insurer Admin' : `${user?.platform || 'Rider'} · ${user?.workerId || ''}`}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>← Log out</button>
      </div>
    </aside>
  );
}
