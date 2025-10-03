// React import not required for new JSX transform
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider, Route, createRoutesFromElements, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './index.css';
import { UserProvider } from './contexts/UserContext';
import { AppProvider } from './contexts/AppContext.impl';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import EstimatesPage from './pages/EstimatesPage';
import InvoicesPage from './pages/InvoicesPage';
import Clients from './components/Clients';
import WorkItemsPage from './pages/WorkItemsPage';
import CompanyInfo from './components/CompanyInfo';
import AdminPanel from './components/AdminPanel';
import { useUser } from './contexts/UserContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const basePath = ((): string => {
  const fromEnv = process.env.REACT_APP_BASE_PATH;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return window.location.pathname.startsWith('/cms') ? '/cms' : '/';
})();

function AppGate() {
  const { isLoggedIn } = useUser();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');
  if (!LOGIN_DISABLED && !isLoggedIn) {
    return <Login />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const routes = createRoutesFromElements(
  <Route element={<AppGate />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/estimates" element={<EstimatesPage />} />
    <Route path="/invoices" element={<InvoicesPage />} />
    <Route path="/clients" element={<Clients />} />
    <Route path="/work-items" element={<WorkItemsPage />} />
    <Route path="/company-info" element={<CompanyInfo />} />
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
);

const useHash = process.env.REACT_APP_USE_HASH_ROUTER === '1';
// Cast to any to support environments where type defs lag behind runtime support
const futureFlags = { v7_startTransition: true, v7_relativeSplatPath: true } as any;
const router = useHash
  ? createHashRouter(routes, { basename: basePath, future: futureFlags })
  : createBrowserRouter(routes, { basename: basePath, future: futureFlags });

root.render(
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <AppProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AppProvider>
    </UserProvider>
  </QueryClientProvider>
);
