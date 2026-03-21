import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import { useAuth } from '@/modules/auth/use-auth';

const LoginPage = lazy(() =>
  import('@/modules/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const PantryPage = lazy(() =>
  import('@/modules/pantry/PantryPage').then((module) => ({ default: module.PantryPage })),
);
const ShoppingListPage = lazy(() =>
  import('@/modules/shopping-list/ShoppingListPage').then((module) => ({ default: module.ShoppingListPage })),
);
const StatsPage = lazy(() =>
  import('@/modules/stats/StatsPage').then((module) => ({ default: module.StatsPage })),
);

function RouteFallback() {
  return <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            )
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="pantry"
            element={
              <Suspense fallback={<RouteFallback />}>
                <PantryPage />
              </Suspense>
            }
          />
          <Route
            path="shopping-list"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ShoppingListPage />
              </Suspense>
            }
          />
          <Route
            path="stats"
            element={
              <Suspense fallback={<RouteFallback />}>
                <StatsPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
