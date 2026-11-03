import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { registerTag, type SavedTag } from '../api';
import { formatDate, formatUid } from '../format';

const DEFAULT_KEY = '0'.repeat(32);

// Accepts "04 7F 09 ...", "04:7F:09:..." or "047f09..." and returns "047F09...".
function cleanHex(value: string): string {
  return value.replace(/[\s:-]/g, '').toUpperCase();
}

function validate(uid: string, itemName: string, key: string): string | null {
  if (!uid) return 'Enter the tag UID.';
  if (!/^[0-9A-F]+$/.test(uid)) return 'UID can only contain hex characters (0-9, A-F).';
  if (uid.length !== 14) return `UID must be 14 hex characters (7 bytes). You entered ${uid.length}.`;
  if (!itemName.trim()) return 'Enter an item name.';
  if (!/^[0-9A-F]+$/.test(key)) return 'Key can only contain hex characters (0-9, A-F).';
  if (key.length !== 32) return `Key must be 32 hex characters (16 bytes). You entered ${key.length}.`;
  return null;
}

export default function RegisterTagPage() {
  const [uidInput, setUidInput] = useState('');
  const [itemName, setItemName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedTag | null>(null);

  const uid = cleanHex(uidInput);
  const key = cleanHex(keyInput);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(uid, itemName, key);
    setError(problem);
    if (problem) return;

    setSaving(true);
    try {
      const tag = await registerTag({
        uid,
        itemName: itemName.trim(),
        ownerName: ownerName.trim() || undefined,
        sdmFileReadKey: key
      });
      setSaved(tag);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setUidInput('');
    setItemName('');
    setOwnerName('');
    setKeyInput('');
    setError(null);
    setSaved(null);
  }

  if (saved) {
    return (
      <main>
        <Link className="back" to="/tags">← All tags</Link>
        <section className="card status ok">
          <span className="badge">SAVED</span>
          <div>
            <h2>{saved.itemName}</h2>
            <p className="subtle">Tag registered</p>
          </div>
        </section>
        <section className="card">
          <table>
            <tbody>
              <tr><td>UID</td><td className="mono">{formatUid(saved.uid)}</td></tr>
              <tr><td>Owner</td><td>{saved.ownerName || '—'}</td></tr>
              <tr><td>Registered</td><td>{formatDate(saved.createdAt)}</td></tr>
            </tbody>
          </table>
        </section>
        <div className="actions">
          <button className="btn primary" onClick={reset}>Register another</button>
          <Link className="btn" to="/tags">Back to tags</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Link className="back" to="/tags">← All tags</Link>
      <div className="page-title">
        <h2>Register tag</h2>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <label>
          <span>UID</span>
          <input
            className="mono"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            placeholder="04 7F 09 EA A7 22 90"
            autoComplete="off"
            autoFocus
          />
          <small className="subtle">
            {uid.length === 14 ? `Will be saved as ${uid}` : '7 bytes. Spaces and colons are fine.'}
          </small>
        </label>

        <label>
          <span>Item name</span>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Leather Wallet" />
        </label>

        <label>
          <span>Owner <span className="subtle">(optional)</span></span>
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </label>

        <label>
          <span>SDM key</span>
          <input
            className="mono"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="32 hex characters"
            autoComplete="off"
          />
          <small className="subtle">
            The key the tag uses to sign its scans.{' '}
            <button type="button" className="link-btn" onClick={() => setKeyInput(DEFAULT_KEY)}>
              Use factory default (all zeros)
            </button>
          </small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Register tag'}
          </button>
        </div>
      </form>
    </main>
  );
}
