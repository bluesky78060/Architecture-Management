// React import not required for new JSX transform
import { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider, Route, createRoutesFromElements, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './index.css';
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from './constants/units';
import { UserProvider } from './contexts/UserContext';
import { AppProvider } from './contexts/AppContext.impl';
import Layout from './components/Layout';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import PendingApproval from './components/PendingApproval';
import { useUser } from './contexts/UserContext';
import { supabase } from './services/supabase';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EstimatesPage = lazy(() => import('./pages/EstimatesPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const Clients = lazy(() => import('./components/Clients'));
const WorkItemsPage = lazy(() => import('./pages/WorkItemsPage'));
const CompanyInfo = lazy(() => import('./components/CompanyInfo'));
const Settings = lazy(() => import('./pages/Settings'));

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
  const [approvalStatus, setApprovalStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected'>('loading');
  const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
    (typeof window !== 'undefined' && window.localStorage != null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

  useEffect(() => {
    const checkApprovalStatus = async (): Promise<void> => {
      if (supabase === null || !isLoggedIn) {
        setApprovalStatus('approved'); // Skip approval check if login disabled or not logged in
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user === null) {
          setApprovalStatus('approved');
          return;
        }

        // Check if user has approval record
        const { data: approval, error: approvalError } = await supabase
          .from('user_approvals')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (approvalError !== null) {
          setApprovalStatus('approved'); // Default to approved on error to avoid blocking
          return;
        }

        if (approval === null) {
          // No approval record - create one for SNS login users
          const provider = user.app_metadata.provider;
          const isSocialLogin = provider === 'google' || provider === 'kakao';

          if (isSocialLogin) {
            // Create approval record with pending status
            // Use email if available, otherwise use user ID as identifier
            const userEmail = user.email ?? `${user.id}@kakao.user`;
            const { error: insertError } = await supabase
              .from('user_approvals')
              .insert({
                user_id: user.id,
                email: userEmail,
                provider: provider,
                status: 'pending',
              });

            if (insertError !== null) {
              // Silent error handling
            }

            setApprovalStatus('pending');
          } else {
            // Email/password users are auto-approved
            setApprovalStatus('approved');
          }
        } else {
          // Has approval record - use its status
          setApprovalStatus(approval.status as 'approved' | 'pending' | 'rejected');
        }
      } catch (err: unknown) {
        setApprovalStatus('approved'); // Default to approved on error
      }
    };

    if (isLoggedIn) {
      void checkApprovalStatus();
    } else {
      setApprovalStatus('approved');
    }
  }, [isLoggedIn]);

  // Show loading state while checking approval
  if (approvalStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  // Redirect to pending approval page if not approved
  if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check login status
  if (LOGIN_DISABLED === false && isLoggedIn === false) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const routes = createRoutesFromElements(
  <>
    {/* Public routes (no authentication required) */}
    <Route path="login" element={<Login />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="pending-approval" element={<PendingApproval />} />

    {/* Protected routes (authentication required) */}
    <Route element={<AppGate />}>
      <Route index element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
      <Route path="estimates" element={<Suspense fallback={<LoadingFallback />}><EstimatesPage /></Suspense>} />
      <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoicesPage /></Suspense>} />
      <Route path="clients" element={<Suspense fallback={<LoadingFallback />}><Clients /></Suspense>} />
      <Route path="work-items" element={<Suspense fallback={<LoadingFallback />}><WorkItemsPage /></Suspense>} />
      <Route path="company-info" element={<Suspense fallback={<LoadingFallback />}><CompanyInfo /></Suspense>} />
      <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </>
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
