import { Link, useNavigate } from 'react-router';
import { items } from '../mockData';
import { formatDate } from '../format';

export default function TagsPage() {
  const navigate = useNavigate();

  return (
    <main>
      <div className="page-title">
        <h2>Tags</h2>
        <p className="subtle">{items.length} tags</p>
      </div>

      <section className="card">
        <table className="clickable">
          <thead>
            <tr>
              <th>Item</th>
              <th>UID</th>
              <th>Owner</th>
              <th>Last scan</th>
              <th>Counter</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ tag, tap, scans }) => (
              <tr key={tag.uid} onClick={() => navigate(`/tags/${tag.uid}`)}>
                <td>
                  <Link to={`/tags/${tag.uid}`}>{tag.itemName}</Link>
                </td>
                <td className="mono">{tag.uid}</td>
                <td>{tag.ownerName}</td>
                <td>{scans.length > 0 ? formatDate(scans[0].scannedAt) : '—'}</td>
                <td>{tap.counter}</td>
                <td className={tap.valid ? 'ok-text' : 'bad-text'}>
                  {tap.valid ? 'Genuine' : 'Invalid'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
