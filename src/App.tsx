import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

function AppContent() {
  const location = useLocation();
  const { isLoggedIn } = useUser();

  // 공개 페이지 체크
  const isPublicPage = location.pathname === '/privacy-policy' || location.pathname === '/terms-of-service';

  // 공개 페이지는 Provider 없이 바로 렌더링
  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Routes>
    );
  }

  // 로그인 체크
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  const needsLogin = LOGIN_DISABLED === false && isLoggedIn === false;

  if (needsLogin) {
    return <Login />;
  }

  // 보호된 라우트
  return (
    <AppProvider>
      <Routes>
        <Route path="/supabase-test" element={<SupabaseTest />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/work-items" element={<WorkItemsPage />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/company-info" element={<CompanyInfo />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/migration" element={<Migration />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
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
