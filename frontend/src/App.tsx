import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import NewAccountPage from './pages/NewAccountPage';
import SendPage       from './pages/SendPage';
import ExchangePage   from './pages/ExchangePage';
import KycPage        from './pages/KycPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/accounts/new" element={<RequireAuth><NewAccountPage /></RequireAuth>} />
      <Route path="/transactions/send" element={<RequireAuth><SendPage /></RequireAuth>} />
      <Route path="/transactions/exchange" element={<RequireAuth><ExchangePage /></RequireAuth>} />
      <Route path="/kyc" element={<RequireAuth><KycPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
