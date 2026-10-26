import { Link, useParams } from 'react-router';
import { items } from '../mockData';
import { counterHex, formatDate, formatUid } from '../format';

export default function TagDetailPage() {
  const { uid } = useParams();
  const item = items.find((i) => i.tag.uid === uid);

  if (!item) {
    return (
      <main>
        <Link to="/tags">← All tags</Link>
        <p>No tag with UID {uid}.</p>
      </main>
    );
  }

  const { tag, tap, scans } = item;

  return (
    <main>
      <Link className="back" to="/tags">← All tags</Link>

      <section className={`card status ${tap.valid ? 'ok' : 'bad'}`}>
        <span className="badge">{tap.valid ? 'GENUINE' : 'INVALID'}</span>
        <div>
          <h2>{tag.itemName}</h2>
          <p className="subtle">Owner: {tag.ownerName}</p>
        </div>
      </section>

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
              <td className="mono">{tap.uid}</td>
              <td className="mono">{formatUid(tap.uid)}</td>
            </tr>
            <tr>
              <td>Scan counter</td>
              <td className="mono">{counterHex(tap.counter)}</td>
              <td>{tap.counter}</td>
            </tr>
            <tr>
              <td>CMAC</td>
              <td className="mono">{tap.cmac}</td>
              <td>{tap.valid ? 'Matches registered key' : 'Does not match'}</td>
            </tr>
            <tr>
              <td>Registered</td>
              <td className="mono">—</td>
              <td>{formatDate(tag.registeredAt)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Scan history</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Counter</th>
              <th>Result</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.scannedAt}>
                <td>{formatDate(s.scannedAt)}</td>
                <td>{s.counter}</td>
                <td className={s.valid ? 'ok-text' : 'bad-text'}>{s.valid ? 'Genuine' : 'Invalid'}</td>
                <td className="mono">{s.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
