import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import { LoginPage } from '@/modules/auth/LoginPage';
import { useAuth } from '@/modules/auth/use-auth';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { PantryPage } from '@/modules/pantry/PantryPage';
import { StatsPage } from '@/modules/stats/StatsPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pantry" element={<PantryPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
