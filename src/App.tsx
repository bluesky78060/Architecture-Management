import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// Theme support with dark mode
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { AppProvider } from './contexts/AppContext.impl';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EstimatesPage from './pages/EstimatesPage';
import InvoicesPage from './pages/InvoicesPage';
import Clients from './components/Clients';
import WorkItemsPage from './pages/WorkItemsPage';
import CompanyInfo from './components/CompanyInfo';
import Schedules from './components/schedules/Schedules';
import Migration from './pages/Migration';
import SupabaseTest from './pages/SupabaseTest';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// 보호된 라우트를 위한 래퍼 컴포넌트
function ProtectedRoutes() {
  const { isLoggedIn } = useUser();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  const needsLogin = LOGIN_DISABLED === false && isLoggedIn === false;

  if (needsLogin) {
    return <Login />;
  }

  return (
    <AppProvider>
      <Routes>
        <Route path="/supabase-test" element={<SupabaseTest />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="estimates" element={<EstimatesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="clients" element={<Clients />} />
          <Route path="work-items" element={<WorkItemsPage />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="company-info" element={<CompanyInfo />} />
          <Route path="settings" element={<Settings />} />
          <Route path="migration" element={<Migration />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}

function AppContent() {
  return (
    <Routes>
      {/* 공개 페이지 (로그인 불필요) */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />

      {/* 모든 나머지 라우트는 보호됨 */}
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
