import { Link, useNavigate } from 'react-router';
import { useApi, type TagListItem } from '../api';
import { formatDate } from '../format';
import ScanResult from '../ScanResult';

export default function TagsPage() {
  const navigate = useNavigate();
  const { data: tags, error, loading } = useApi<TagListItem[]>('/api/tags');

  return (
    <main>
      <div className="page-title row">
        <div>
          <h2>Tags</h2>
          <p className="subtle">{tags ? `${tags.length} tags` : ' '}</p>
        </div>
        <Link className="btn primary" to="/tags/new">+ Register tag</Link>
      </div>

      {loading && <p className="subtle">Loading tags…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {tags && tags.length === 0 && (
        <section className="card">
          <p className="subtle">No tags yet. Register your first tag to get started.</p>
        </section>
      )}

      {tags && tags.length > 0 && (
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
              {tags.map((tag) => (
                <tr key={tag.uid} onClick={() => navigate(`/tags/${tag.uid}`)}>
                  <td>
                    <Link to={`/tags/${tag.uid}`}>{tag.itemName || 'Unnamed item'}</Link>
                  </td>
                  <td className="mono">{tag.uid}</td>
                  <td>{tag.ownerName || '—'}</td>
                  <td>{tag.lastScan ? formatDate(tag.lastScan.scannedAt) : '—'}</td>
                  <td>{tag.lastScan?.counter ?? '—'}</td>
                  <td><ScanResult scan={tag.lastScan} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
