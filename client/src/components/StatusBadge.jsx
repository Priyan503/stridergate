export default function StatusBadge({ status }) {
  const map = {
    active: 'badge-green',
    flagged: 'badge-yellow',
    rejected: 'badge-red',
    paid: 'badge-green',
    pending: 'badge-yellow',
  };
  return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>;
}
