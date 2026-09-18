import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import Docs from './pages/Docs';

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
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      {user && <NavBar />}
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
          path="/docs"
          element={<RequireAuth><Docs /></RequireAuth>}
        />
        <Route
          path="/employee/:id"
          element={<RequireAuth><Employee /></RequireAuth>}
        />
        <Route path="/" element={<Navigate to={defaultHome} replace />} />
        <Route path="*" element={<Navigate to={defaultHome} replace />} />
      </Routes>
    </div>
  );
};

export default App;