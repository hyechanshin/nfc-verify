import { Link, useNavigate } from 'react-router';
import { useApi, type DashboardData } from '../api';
import { formatDate } from '../format';
import ScanResult from '../ScanResult';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, error, loading } = useApi<DashboardData>('/api/dashboard');

  if (loading) {
    return <main><p className="subtle">Loading dashboard…</p></main>;
  }
  if (error || !data) {
    return <main><p className="form-error" role="alert">{error}</p></main>;
  }

  const stats = [
    { label: 'Total tags', value: data.totalTags },
    { label: 'Total scans', value: data.totalScans },
    { label: 'Invalid scans', value: data.invalidScans, alert: data.invalidScans > 0 },
    { label: 'Flagged tags', value: data.flaggedTags, alert: data.flaggedTags > 0 }
  ];

  return (
    <main>
      <div className="page-title">
        <h2>Dashboard</h2>
      </div>

      <div className="stats">
        {stats.map((s) => (
          <section key={s.label} className="card stat">
            <p className="subtle">{s.label}</p>
            <p className={`stat-value ${s.alert ? 'bad-text' : ''}`}>{s.value}</p>
          </section>
        ))}
      </div>

      <section className="card">
        <h3>Recently scanned tags</h3>
        {data.recentTags.length === 0 ? (
          <p className="subtle">No scans yet. Tap a registered tag to see it here.</p>
        ) : (
          <table className="clickable">
            <thead>
              <tr>
                <th>Item</th>
                <th>UID</th>
                <th>Last scan</th>
                <th>Counter</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTags.map((t) => (
                <tr key={t.uid} onClick={() => navigate(`/tags/${t.uid}`)}>
                  <td>
                    <Link to={`/tags/${t.uid}`}>{t.itemName || 'Deleted tag'}</Link>
                  </td>
                  <td className="mono">{t.uid}</td>
                  <td>{formatDate(t.scannedAt)}</td>
                  <td>{t.counter ?? '—'}</td>
                  <td><ScanResult scan={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
