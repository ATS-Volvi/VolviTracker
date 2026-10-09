import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import Finance from './pages/finance/Finance';
import ClientSideFinance from './pages/finance/ClientSideFinance';
import SupplierSideFinance from './pages/finance/SupplierSideFinance';
import CashBookFinance from './pages/finance/CashBookFinance';
import TaxFinance from './pages/finance/TaxFinance';
import CashFlowFinance from './pages/finance/CashFlowFinance';
import MasterData from './pages/masterData/MasterData';

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
              element={<Navigate to="/sales/client-pos" replace />}
            />
            <Route
              path="/sales/client-pos"
              element={<RequireAuth><ClientSideFinance /></RequireAuth>}
            />
            <Route
              path="/purchases"
              element={<Navigate to="/purchases/supplier-pos" replace />}
            />
            <Route
              path="/purchases/supplier-pos"
              element={<RequireAuth><SupplierSideFinance /></RequireAuth>}
            />
            <Route
              path="/finance/client"
              element={<RequireAuth><ClientSideFinance /></RequireAuth>}
            />
            <Route
              path="/finance/client-invoices"
              element={<Navigate to="/finance/client?tab=invoices" replace />}
            />
            <Route
              path="/finance/receipts"
              element={<Navigate to="/finance/client?tab=receipts" replace />}
            />
            <Route
              path="/finance/ar-ageing"
              element={<Navigate to="/finance/client?tab=ageing" replace />}
            />
            <Route
              path="/finance/client-statements"
              element={<Navigate to="/finance/client?tab=statements" replace />}
            />
            <Route
              path="/finance/supplier"
              element={<RequireAuth><SupplierSideFinance /></RequireAuth>}
            />
            <Route
              path="/finance/supplier-invoices"
              element={<Navigate to="/finance/supplier?tab=invoices" replace />}
            />
            <Route
              path="/finance/payments"
              element={<Navigate to="/finance/supplier?tab=payments" replace />}
            />
            <Route
              path="/finance/ap-ageing"
              element={<Navigate to="/finance/supplier?tab=ageing" replace />}
            />
            <Route
              path="/finance/supplier-statements"
              element={<Navigate to="/finance/supplier?tab=statements" replace />}
            />
            <Route
              path="/finance/cash-book"
              element={<RequireAuth><CashBookFinance /></RequireAuth>}
            />
            <Route
              path="/finance/tax"
              element={<RequireAuth><TaxFinance /></RequireAuth>}
            />
            <Route
              path="/finance/cash-flow"
              element={<RequireAuth><CashFlowFinance /></RequireAuth>}
            />
            <Route
              path="/finance/cashflow"
              element={<Navigate to="/finance/cash-flow" replace />}
            />
            <Route
              path="/finance"
              element={<RequireAuth><Finance /></RequireAuth>}
            />
            <Route
              path="/finance/*"
              element={<RequireAuth><Finance /></RequireAuth>}
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
        </main>
      </div>
    </div>
  );
};

export default App;