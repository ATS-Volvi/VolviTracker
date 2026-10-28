import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Lazy-loaded route pages for optimized initial bundle size and code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employee = lazy(() => import('./pages/Employee'));
const Finance = lazy(() => import('./pages/finance/Finance'));
const ClientSideFinance = lazy(() => import('./pages/finance/ClientSideFinance'));
const SupplierSideFinance = lazy(() => import('./pages/finance/SupplierSideFinance'));
const CashBookFinance = lazy(() => import('./pages/finance/CashBookFinance'));
const TaxFinance = lazy(() => import('./pages/finance/TaxFinance'));
const CashFlowFinance = lazy(() => import('./pages/finance/CashFlowFinance'));
const MasterData = lazy(() => import('./pages/masterData/MasterData'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ProjectEditPage = lazy(() => import('./pages/ProjectEditPage'));

const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

const RequireAdmin = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={user ? `/employee/${user.id}` : '/login'} replace />;
  }

  return children;
};

const RequireProjectAccess = ({ children }) => {
  const { user, isAdmin, isProjectManager, canManageProjects, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasAccess = Boolean(isAdmin || isProjectManager || canManageProjects);
  if (!hasAccess) {
    return <Navigate to={user ? `/employee/${user.id}` : '/login'} replace />;
  }

  return children;
};

const App = () => {
  const { user, isAdmin, isProjectManager, canManageProjects, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('volvitech_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('volvitech_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasProjectAccess = Boolean(isAdmin || isProjectManager || canManageProjects);
  const defaultHome = user
    ? (hasProjectAccess ? '/projects' : `/employee/${user.id}`)
    : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ScrollToTop />
      {user && <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapsed} />}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${user ? (isCollapsed ? 'md:pl-20' : 'md:pl-64') : ''}`}>
        <main className="flex-1">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/login" element={user ? <Navigate to={defaultHome} replace /> : <Login />} />
              <Route
                path="/projects"
                element={
                  <RequireAuth>
                    <RequireProjectAccess>
                      <Dashboard />
                    </RequireProjectAccess>
                  </RequireAuth>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <RequireAuth>
                    <ProjectEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <RequireAuth>
                    <ProjectEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <RequireAuth>
                    <ProjectEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/tasks"
                element={
                  <RequireAuth>
                    <TasksPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/projects/:projectId/tasks"
                element={
                  <RequireAuth>
                    <TasksPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={<Navigate to="/projects" replace />}
              />
              <Route
                path="/master-data"
                element={<RequireAuth><MasterData /></RequireAuth>}
              />
              <Route
                path="/master-data/:companyId"
                element={<RequireAuth><MasterData /></RequireAuth>}
              />
              <Route
                path="/sales"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/sales/client-pos"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/purchases"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/purchases/supplier-pos"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/client"
                element={<RequireAuth><RequireAdmin><ClientSideFinance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/client-invoices"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client?tab=invoices" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/receipts"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client?tab=receipts" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/ar-ageing"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client?tab=ageing" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/client-statements"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/client?tab=statements" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/supplier"
                element={<RequireAuth><RequireAdmin><SupplierSideFinance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/supplier-invoices"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier?tab=invoices" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/payments"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier?tab=payments" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/ap-ageing"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier?tab=ageing" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/supplier-statements"
                element={<RequireAuth><RequireAdmin><Navigate to="/finance/supplier?tab=statements" replace /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/cash-book"
                element={<RequireAuth><RequireAdmin><CashBookFinance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/tax"
                element={<RequireAuth><RequireAdmin><TaxFinance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/cash-flow"
                element={<RequireAuth><RequireAdmin><CashFlowFinance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance"
                element={<RequireAuth><RequireAdmin><Finance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/finance/*"
                element={<RequireAuth><RequireAdmin><Finance /></RequireAdmin></RequireAuth>}
              />
              <Route
                path="/docs"
                element={<Navigate to="/master-data" replace />}
              />
              <Route
                path="/employee/:id"
                element={<RequireAuth><Employee /></RequireAuth>}
              />
              <Route path="/" element={<Navigate to={defaultHome} replace />} />
              <Route path="*" element={<Navigate to={defaultHome} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;