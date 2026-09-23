import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import Docs from './pages/Docs';
import Finance from './pages/finance/Finance';

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

const App = () => {
  const { user, isAdmin, loading } = useAuth();
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

  const defaultHome = user
    ? (isAdmin ? '/dashboard' : `/employee/${user.id}`)
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
              path="/dashboard"
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <Dashboard />
                  </RequireAdmin>
                </RequireAuth>
              }
            />
            <Route
              path="/finance/*"
              element={<RequireAuth><Finance /></RequireAuth>}
            />
            <Route
              path="/finance"
              element={<RequireAuth><Finance /></RequireAuth>}
            />
            <Route
              path="/docs"
              element={<Navigate to="/finance?tab=vault" replace />}
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