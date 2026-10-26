import { Link } from 'react-router';
import { items } from '../mockData';
import { formatDate } from '../format';

export default function DashboardPage() {
  const allScans = items.flatMap(({ tag, scans }) =>
    scans.map((scan) => ({ ...scan, uid: tag.uid, itemName: tag.itemName }))
  );
  const invalidScans = allScans
    .filter((s) => !s.valid)
    .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
  const flaggedTags = items.filter((i) => !i.tap.valid).length;

  const stats = [
    { label: 'Total tags', value: items.length },
    { label: 'Total scans', value: allScans.length },
    { label: 'Invalid scans', value: invalidScans.length, alert: invalidScans.length > 0 },
    { label: 'Flagged tags', value: flaggedTags, alert: flaggedTags > 0 }
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
        {invalidScans.length === 0 ? (
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
              {invalidScans.map((s) => (
                <tr key={`${s.uid}-${s.scannedAt}`}>
                  <td>{formatDate(s.scannedAt)}</td>
                  <td>
                    <Link to={`/tags/${s.uid}`}>{s.itemName}</Link>
                  </td>
                  <td className="mono">{s.uid}</td>
                  <td>{s.counter}</td>
                  <td className="mono">{s.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
