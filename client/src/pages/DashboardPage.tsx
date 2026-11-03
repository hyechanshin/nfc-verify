import { Link } from 'react-router';
import { useApi, type DashboardData } from '../api';
import { formatDate } from '../format';

export default function DashboardPage() {
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
        <h3>Recent invalid scans</h3>
        {data.recentInvalidScans.length === 0 ? (
          <p className="subtle">No invalid scans.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Item</th>
                <th>UID</th>
                <th>Counter</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvalidScans.map((s) => (
                <tr key={`${s.uid}-${s.scannedAt}`}>
                  <td>{formatDate(s.scannedAt)}</td>
                  <td>
                    <Link to={`/tags/${s.uid}`}>{s.itemName || 'Deleted tag'}</Link>
                  </td>
                  <td className="mono">{s.uid}</td>
                  <td>{s.counter ?? '—'}</td>
                  <td className="mono">{s.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
