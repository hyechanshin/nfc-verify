import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { deleteTag, useApi, type TagDetail } from '../api';
import { counterHex, formatDate, formatUid } from '../format';
import ScanResult from '../ScanResult';

export default function TagDetailPage() {
  const { uid = '' } = useParams();
  const navigate = useNavigate();
  const { data: tag, error, loading } = useApi<TagDetail>(`/api/tags/${uid}`);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loading) {
    return <main><p className="subtle">Loading tag…</p></main>;
  }
  if (error || !tag) {
    return (
      <main>
        <Link className="back" to="/tags">← All tags</Link>
        <p className="form-error" role="alert">{error}</p>
      </main>
    );
  }

  const latest = tag.scans[0] ?? null;
  const status = !latest ? 'none' : latest.valid ? 'ok' : 'bad';
  const badge = { none: 'NOT SCANNED', ok: 'GENUINE', bad: 'INVALID' }[status];

  async function handleDelete() {
    if (!tag) return;
    if (!window.confirm(`Delete "${tag.itemName || tag.uid}"? Its scan history will be deleted too.`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTag(tag.uid);
      navigate('/tags');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the tag.');
      setDeleting(false);
    }
  }

  return (
    <main>
      <Link className="back" to="/tags">← All tags</Link>

      <section className={`card status ${status}`}>
        <span className="badge">{badge}</span>
        <div>
          <h2>{tag.itemName || 'Unnamed item'}</h2>
          <p className="subtle">Owner: {tag.ownerName || '—'}</p>
        </div>
      </section>

      {tag.defaultKey && (
        <p className="form-error" role="alert">
          This tag uses the factory-default key (all zeros), so anyone could make a copy that passes the check.
          Set a unique random key in GoToTags and register the tag again.
        </p>
      )}

      <section className="card">
        <h3>Tag details</h3>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Raw (hex)</th>
              <th>Readable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>UID</td>
              <td className="mono">{tag.uid}</td>
              <td className="mono">{formatUid(tag.uid)}</td>
            </tr>
            <tr>
              <td>Last counter</td>
              <td className="mono">{latest?.counter != null ? counterHex(latest.counter) : '—'}</td>
              <td>{latest?.counter ?? '—'}</td>
            </tr>
            <tr>
              <td>Key check value</td>
              <td className="mono">{tag.keyCheckValue ?? '—'}</td>
              <td>{tag.defaultKey ? 'Factory-default key' : 'Key stored encrypted'}</td>
            </tr>
            <tr>
              <td>Registered</td>
              <td className="mono">—</td>
              <td>{formatDate(tag.createdAt)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Scan history</h3>
        {tag.scans.length === 0 ? (
          <p className="subtle">No scans yet. Scans appear here once the tag is tapped.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Counter</th>
                <th>Result</th>
                <th title="A hash of the visitor's IP address. The same visitor gets the same ID.">Visitor</th>
              </tr>
            </thead>
            <tbody>
              {tag.scans.map((s) => (
                <tr key={s._id}>
                  <td>{formatDate(s.scannedAt)}</td>
                  <td>{s.counter ?? '—'}</td>
                  <td><ScanResult scan={s} /></td>
                  <td className="mono">{s.ip ? s.ip.slice(0, 8) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
      <div className="actions">
        <button className="btn danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete tag'}
        </button>
      </div>
    </main>
  );
}
