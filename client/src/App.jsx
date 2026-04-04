import { useState, useEffect } from 'react';
import LoginPage       from './pages/LoginPage';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard  from './pages/AdminDashboard';
import Sidebar         from './components/Sidebar';
import Toast           from './components/Toast';

export default function App() {
  const [role, setRole]       = useState(null);  // 'worker' | 'admin' | null
  const [user, setUser]       = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [toast, setToast]     = useState(null);
  const [flagged, setFlagged] = useState(1);  // count of flagged claims for badge

  // Restore session from sessionStorage
  useEffect(() => {
    const savedRole = sessionStorage.getItem('gs_role');
    const savedUser = sessionStorage.getItem('gs_user');
    if (savedRole && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setRole(savedRole);
      setUser(parsedUser);
      setActivePage(savedRole === 'admin' ? 'overview' : 'dashboard');
    }
  }, []);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const handleLogin = (r, u) => {
    setRole(r);
    setUser(u);
    setActivePage(r === 'admin' ? 'overview' : 'dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('gs_token');
    sessionStorage.removeItem('gs_role');
    sessionStorage.removeItem('gs_user');
    setRole(null);
    setUser(null);
    setActivePage(null);
  };

  // Login screen
  if (!role) return (
    <>
      <LoginPage onLogin={handleLogin} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );

  return (
    <>
      <div className="app-shell">
        <Sidebar
          role={role}
          user={user}
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          flaggedCount={role === 'admin' ? flagged : 0}
        />
        <main className="main-content">
          {role === 'worker' && (
            <WorkerDashboard
              worker={user}
              activePage={activePage}
              showToast={showToast}
            />
          )}
          {role === 'admin' && (
            <AdminDashboard
              activePage={activePage}
              showToast={showToast}
            />
          )}
        </main>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
