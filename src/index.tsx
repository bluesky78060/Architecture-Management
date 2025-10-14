// React import not required for new JSX transform
import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider, Route, createRoutesFromElements, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './index.css';
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from './constants/units';
import { UserProvider } from './contexts/UserContext';
import { AppProvider } from './contexts/AppContext.impl';
import Layout from './components/Layout';
import Login from './components/Login';
import { useUser } from './contexts/UserContext';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EstimatesPage = lazy(() => import('./pages/EstimatesPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const Clients = lazy(() => import('./components/Clients'));
const WorkItemsPage = lazy(() => import('./pages/WorkItemsPage'));
const CompanyInfo = lazy(() => import('./components/CompanyInfo'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Migration = lazy(() => import('./pages/Migration'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-magic-numbers
const STALE_MINUTES = 5;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // eslint-disable-next-line no-magic-numbers
      retry: 1,
      staleTime: STALE_MINUTES * SECONDS_IN_MINUTE * MS_IN_SECOND, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Hosting-aware basename resolution
const resolveBasename = (): string => {
  // For Vercel and other standard hosting, always use root
  return '/';
};

function AppGate() {
  const { isLoggedIn } = useUser();
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage != null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');
  if (LOGIN_DISABLED === false && isLoggedIn === false) {
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
    <Route index element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
    <Route path="estimates" element={<Suspense fallback={<LoadingFallback />}><EstimatesPage /></Suspense>} />
    <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoicesPage /></Suspense>} />
    <Route path="clients" element={<Suspense fallback={<LoadingFallback />}><Clients /></Suspense>} />
    <Route path="work-items" element={<Suspense fallback={<LoadingFallback />}><WorkItemsPage /></Suspense>} />
    <Route path="company-info" element={<Suspense fallback={<LoadingFallback />}><CompanyInfo /></Suspense>} />
    <Route path="admin" element={<Suspense fallback={<LoadingFallback />}><AdminPanel /></Suspense>} />
    <Route path="migration" element={<Suspense fallback={<LoadingFallback />}><Migration /></Suspense>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
);

// Always use BrowserRouter for better GitHub Pages compatibility
// HashRouter was causing routing issues on GitHub Pages
const useHash = false;
const basePath = resolveBasename();
// React Router v7 future flags for forward compatibility
const futureFlags: { v7_startTransition: boolean; v7_relativeSplatPath: boolean } = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};
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
