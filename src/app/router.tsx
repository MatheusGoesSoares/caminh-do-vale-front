import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { isDemoMode } from '@/services';
import { useSession } from '@/hooks/use-session';

const Login = lazy(() => import('@/features/auth/login-page'));

function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (isDemoMode() || session) return <Outlet />;
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

const Dashboard = lazy(() => import('@/features/dashboard/page'));
const Monitoring = lazy(() => import('@/features/monitoring/page'));
const Shipments = lazy(() => import('@/features/shipments/page'));
const ShipmentDetail = lazy(() => import('@/features/shipments/detail-page'));
const Tracking = lazy(() => import('@/features/tracking/page'));
const Alerts = lazy(() => import('@/features/alerts/page'));
const Reports = lazy(() => import('@/features/reports/page'));
const Settings = lazy(() => import('@/features/settings/page'));

function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-56 rounded-md bg-[#E6F4EA]" />
          <div className="mt-2 h-4 w-80 rounded-md bg-[#E6F4EA]" />
        </div>
        <div className="h-4 w-40 rounded-md bg-[#E6F4EA]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-[#E6F4EA] bg-white"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-1 h-72 rounded-xl border border-[#E6F4EA] bg-white lg:col-span-2" />
        <div className="h-72 rounded-xl border border-[#E6F4EA] bg-white" />
      </div>

      <div className="h-64 rounded-xl border border-[#E6F4EA] bg-white" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="login"
        element={isDemoMode() ? <Navigate to="/" replace /> : <Suspense fallback={null}><Login /></Suspense>}
      />
      <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="monitoramento"
          element={
            <Suspense fallback={<PageLoader />}>
              <Monitoring />
            </Suspense>
          }
        />
        <Route
          path="cargas"
          element={
            <Suspense fallback={<PageLoader />}>
              <Shipments />
            </Suspense>
          }
        />
        <Route
          path="cargas/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ShipmentDetail />
            </Suspense>
          }
        />
        <Route
          path="mapa"
          element={
            <Suspense fallback={<PageLoader />}>
              <Tracking />
            </Suspense>
          }
        />
        <Route
          path="alertas"
          element={
            <Suspense fallback={<PageLoader />}>
              <Alerts />
            </Suspense>
          }
        />
        <Route
          path="relatorios"
          element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="configuracoes"
          element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>
      </Route>
    </Routes>
  );
}
