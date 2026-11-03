import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router';
import { getSession, logout } from './api';
import DashboardPage from './pages/DashboardPage';
import TagsPage from './pages/TagsPage';
import TagDetailPage from './pages/TagDetailPage';
import RegisterTagPage from './pages/RegisterTagPage';
import VerifyPage from './pages/VerifyPage';
import LoginPage from './pages/LoginPage';

// Admin pages: shows the login screen until the server confirms an admin session.
function AdminLayout() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(
      (s) => setAdmin(s.admin),
      (err: Error) => setError(err.message)
    );
  }, []);

  async function handleLogout() {
    await logout().catch(() => {});
    setAdmin(false);
  }

  if (error) {
    return <div className="page"><p className="form-error" role="alert">{error}</p></div>;
  }
  if (admin === null) {
    return <div className="page"><p className="subtle">Loading…</p></div>;
  }
  if (!admin) {
    return <LoginPage onLogin={() => setAdmin(true)} />;
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>NFC Verify</h1>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tags">Tags</NavLink>
        </nav>
        <button className="btn logout" onClick={handleLogout}>Log out</button>
      </header>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: opened by phones tapping a tag */}
        <Route path="/verify" element={<VerifyPage />} />

        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/tags/new" element={<RegisterTagPage />} />
          <Route path="/tags/:uid" element={<TagDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
