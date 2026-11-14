import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiError, verifyTap, type VerifyResult } from '../api';
import { formatDate, formatUid } from '../format';
import ScanResult from '../ScanResult';

function explain(r: VerifyResult): string {
  if (r.reason === 'ok') return 'This item carries an authentic NFC Verify tag.';
  if (r.reason === 'reopened') {
    return `This link was already verified as genuine on ${formatDate(r.scannedAt)}. To check the item again, tap the tag.`;
  }
  if (r.reason === 'bad_cmac') {
    return "The tag's signature does not match. The tag or the link may have been tampered with.";
  }
  return 'This link was already used. Tap the tag again for a fresh check.';
}

// A reopened link is grey, never green: only a fresh tap proves the item is genuine.
const STATUS = {
  genuine: { css: 'ok', badge: 'GENUINE' },
  invalid: { css: 'bad', badge: 'INVALID' },
  checked: { css: 'none', badge: 'ALREADY CHECKED' }
} as const;

interface TapDetailsProps {
  uid: string;
  ctr: string;
  cmac: string;
  cmacNote: string;
  checkedAt?: string;
}

// What the tag put in the link, raw and readable.
function TapDetails({ uid, ctr, cmac, cmacNote, checkedAt }: TapDetailsProps) {
  return (
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
            <td className="mono">{uid}</td>
            <td className="mono">{formatUid(uid)}</td>
          </tr>
          <tr>
            <td>Tap counter</td>
            <td className="mono">{ctr}</td>
            <td>Tap #{parseInt(ctr, 16)}</td>
          </tr>
          <tr>
            <td>CMAC</td>
            <td className="mono">{cmac}</td>
            <td>{cmacNote}</td>
          </tr>
          {checkedAt && (
            <tr>
              <td>Checked</td>
              <td className="mono">—</td>
              <td>{formatDate(checkedAt)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

// Public page a phone opens when it taps a tag. No admin navigation or private data.
export default function VerifyPage() {
  const { search } = useLocation();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unregistered, setUnregistered] = useState(false);
  const params = new URLSearchParams(search);

  useEffect(() => {
    let cancelled = false;
    verifyTap(search).then(
      (r) => !cancelled && setResult(r),
      (err: Error) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setUnregistered(true);
        else setError(err.message);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="page narrow">
      <header className="topbar">
        <h1>NFC Verify</h1>
      </header>

      {!result && !error && !unregistered && (
        <section className="card">
          <p>Verifying tag…</p>
          <p className="subtle">This can take a little longer if the server was asleep.</p>
        </section>
      )}

      {error && (
        <section className="card status bad">
          <span className="badge">ERROR</span>
          <div>
            <h2>Could not verify</h2>
            <p className="subtle">{error}</p>
          </div>
        </section>
      )}

      {unregistered && (
        <main>
          <section className="card status none">
            <span className="badge">NOT REGISTERED</span>
            <div>
              <h2>Unknown tag</h2>
              <p className="subtle">This tag is not registered with NFC Verify yet. Registering checks the key against this tap, so only a genuine tag can be added.</p>
            </div>
          </section>
          {/* The server only answers 404 after the link passed its format checks. */}
          <TapDetails
            uid={params.get('uid')!.toUpperCase()}
            ctr={params.get('ctr')!.toUpperCase()}
            cmac={params.get('cmac')!.toUpperCase()}
            cmacNote="Checked when you register"
          />
          <div className="actions">
            {/* Carries uid/ctr/cmac along so the server can check the key against this tap. */}
            <Link className="btn primary" to={`/tags/new${search}`}>Register this tag (admin)</Link>
          </div>
        </main>
      )}

      {result && (
        <main>
          <section className={`card status ${STATUS[result.result].css}`}>
            <span className="badge">{STATUS[result.result].badge}</span>
            <div>
              <h2>{result.itemName || 'Unnamed item'}</h2>
              <p className="subtle">{explain(result)}</p>
            </div>
          </section>

          <TapDetails
            uid={result.uid}
            ctr={result.ctr}
            cmac={result.cmac}
            cmacNote={result.reason === 'bad_cmac' ? 'Does not match' : 'Valid signature'}
            checkedAt={result.scannedAt}
          />

          <section className="card">
            <h3>Scan history</h3>
            <p className="subtle">Checked {result.scanCount} {result.scanCount === 1 ? 'time' : 'times'} in total.</p>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Tap</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {result.recentScans.map((s) => (
                  <tr key={s.scannedAt}>
                    <td>{formatDate(s.scannedAt)}</td>
                    <td>{s.counter ?? '—'}</td>
                    <td><ScanResult scan={s} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}
    </div>
  );
}
