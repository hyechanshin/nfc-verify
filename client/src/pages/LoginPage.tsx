import { useState, type FormEvent } from 'react';
import { login } from '../api';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError('Enter the admin password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <header className="topbar">
        <h1>NFC Verify</h1>
      </header>
      <main>
        <div className="page-title">
          <h2>Admin login</h2>
          <p className="subtle">Log in to manage tags and view scan history.</p>
        </div>
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="actions">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
