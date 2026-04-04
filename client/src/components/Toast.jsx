import { useEffect } from 'react';

export default function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast">
      <span className="toast-icon">{icons[type] || 'ℹ️'}</span>
      <span>{msg}</span>
      <span
        style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}
        onClick={onClose}
      >
        ×
      </span>
    </div>
  );
}
