import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import TagsPage from './pages/TagsPage';
import TagDetailPage from './pages/TagDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="page">
        <header className="topbar">
          <h1>NFC Verify</h1>
          <nav>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/tags">Tags</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/tags/:uid" element={<TagDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
