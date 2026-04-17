export default function BCSBadge({ score }) {
  if (score >= 70) return <span className="badge badge-green"><span className="badge-dot" />BCS {score}</span>;
  if (score >= 40) return <span className="badge badge-yellow"><span className="badge-dot" />BCS {score}</span>;
  return <span className="badge badge-red"><span className="badge-dot" />BCS {score}</span>;
}
