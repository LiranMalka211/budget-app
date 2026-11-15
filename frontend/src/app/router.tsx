import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/features/auth/authStore'
import { ROUTES } from './routes'

// Pages are lazy-loaded so each feature becomes its own bundle chunk.
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const TransactionsPage = lazy(() => import('@/features/transactions/pages/TransactionsPage'))
const ScheduledPage = lazy(() => import('@/features/scheduled/pages/ScheduledPage'))
const FamilyPage = lazy(() => import('@/features/family/pages/FamilyPage'))
const ImportPage = lazy(() => import('@/features/imports/pages/ImportPage'))
const InsightsPage = lazy(() => import('@/features/insights/pages/InsightsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

/** Full-screen spinner used while the session is restored or a page chunk loads. */
function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Route guard: renders children only for logged-in users, otherwise redirects to the login page. */
function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageLoader />
  if (status === 'anonymous') return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
  return <Outlet />
}

/** Route guard for auth pages: sends already logged-in users to the dashboard. */
function RedirectIfAuthenticated() {
  const { status } = useAuth()
  if (status === 'loading') return <FullPageLoader />
  if (status === 'authenticated') return <Navigate to={ROUTES.dashboard} replace />
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Outlet />
    </Suspense>
  )
}

/** Wraps protected pages in the app shell with a suspense boundary for lazy chunks. */
function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<FullPageLoader />}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

/** The application route table. */
export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
      { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ShellLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.transactions, element: <TransactionsPage /> },
          { path: ROUTES.scheduled, element: <ScheduledPage /> },
          { path: ROUTES.family, element: <FamilyPage /> },
          { path: ROUTES.import, element: <ImportPage /> },
          { path: ROUTES.insights, element: <InsightsPage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
])
