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
  const { isLoggedIn } = useUser();
  const location = useLocation();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  /* eslint-disable no-console */
  console.log('🔵 [App] isLoggedIn:', isLoggedIn);
  console.log('🔵 [App] LOGIN_DISABLED:', LOGIN_DISABLED);
  /* eslint-enable no-console */

  // 공개 페이지는 로그인 체크 우회
  const publicPaths = ['/privacy-policy', '/terms-of-service'];
  const isPublicPath = publicPaths.includes(location.pathname);

  if (!isPublicPath && LOGIN_DISABLED === false && isLoggedIn === false) {
    /* eslint-disable no-console */
    console.log('⚠️ [App] Redirecting to Login page');
    /* eslint-enable no-console */
    return <Login />;
  }

  return (
    <AppProvider>
      <Routes>
        {/* 공개 페이지 (로그인 불필요) */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* 보호된 페이지 (로그인 필요) */}
        <Route path="/supabase-test" element={<SupabaseTest />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
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
