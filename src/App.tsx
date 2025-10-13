import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
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
import AdminPanel from './components/AdminPanel';
import Migration from './pages/Migration';

function AppContent() {
  const { isLoggedIn } = useUser();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  if (LOGIN_DISABLED === false && isLoggedIn === false) {
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
        <Route path="/migration" element={<Migration />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <UserProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </UserProvider>
  );
}

export default App;
