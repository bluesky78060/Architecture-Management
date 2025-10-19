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
import Migration from './pages/Migration';
import SupabaseTest from './pages/SupabaseTest';
import Settings from './pages/Settings';

function AppContent() {
  const { isLoggedIn } = useUser();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  /* eslint-disable no-console */
  console.log('🔵 [App] isLoggedIn:', isLoggedIn);
  console.log('🔵 [App] LOGIN_DISABLED:', LOGIN_DISABLED);
  /* eslint-enable no-console */

  if (LOGIN_DISABLED === false && isLoggedIn === false) {
    /* eslint-disable no-console */
    console.log('⚠️ [App] Redirecting to Login page');
    /* eslint-enable no-console */
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/estimates" element={<EstimatesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/work-items" element={<WorkItemsPage />} />
        <Route path="/company-info" element={<CompanyInfo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/migration" element={<Migration />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Routes>
          <Route path="/supabase-test" element={<SupabaseTest />} />
          <Route path="*" element={
            <AppProvider>
              <AppContent />
            </AppProvider>
          } />
        </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
