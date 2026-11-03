import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import TagsPage from './pages/TagsPage';
import TagDetailPage from './pages/TagDetailPage';
import RegisterTagPage from './pages/RegisterTagPage';
import VerifyPage from './pages/VerifyPage';

function AdminLayout() {
  return (
    <div className="page">
      <header className="topbar">
        <h1>NFC Verify</h1>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tags">Tags</NavLink>
        </nav>
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
