import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useData } from './DataContext';
import { hashPassword, DEFAULT_PASSWORD_HASH, DEFAULT_DEMO_PASSWORD } from '../utils/crypto';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'volvitech_auth_session';
const LEGACY_USER_KEY = 'tracker_user';

export const AuthProvider = ({ children }) => {
  const { employees, addEmployee, updateEmployeeCredentials } = useData();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on app load
  useEffect(() => {
    try {
      // Check localStorage first, then sessionStorage
      let saved = localStorage.getItem(AUTH_STORAGE_KEY);
      let isLocal = true;
      if (!saved) {
        saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
        isLocal = false;
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        // Check expiration
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(LEGACY_USER_KEY);
        } else {
          setUser(parsed.user);
          setSession(parsed);
        }
      } else {
        // Check legacy tracker_user
        const legacy = localStorage.getItem(LEGACY_USER_KEY);
        if (legacy) {
          const u = JSON.parse(legacy);
          setUser(u);
        }
      }
    } catch {
      // Ignore hydration parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const persistSession = useCallback((sessionData, rememberMe = true) => {
    const serialized = JSON.stringify(sessionData);
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(sessionData.user));
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(sessionData.user));
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setUser(sessionData.user);
    setSession(sessionData);
  }, []);

  // Login with email & password
  const login = async (email, password, rememberMe = true) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Lookup in active employees list or fallback
    const targetEmp = employees.find(e => (e.email || '').toLowerCase() === cleanEmail);
    if (!targetEmp) {
      return { success: false, error: 'No account found with this email address. Please check or create an account.' };
    }

    const inputHash = await hashPassword(password);
    const expectedHash = targetEmp.passwordHash || DEFAULT_PASSWORD_HASH;

    if (inputHash !== expectedHash) {
      // Also allow direct match with default demo password for quick testing
      if (password !== DEFAULT_DEMO_PASSWORD) {
        return { success: false, error: 'Invalid password. If this is a demo account, use password123.' };
      }
    }

    const sessionUser = {
      id: targetEmp.id,
      fullName: targetEmp.fullName,
      email: targetEmp.email,
      role: targetEmp.role || 'Member',
      avatar: targetEmp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetEmp.fullName)}&background=0070F3&color=fff`
    };

    const newSession = {
      token: 'volvi_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      user: sessionUser,
      rememberMe,
      createdAt: Date.now(),
      expiresAt: rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null
    };

    persistSession(newSession, rememberMe);
    return { success: true, user: sessionUser };
  };

  // Quick 1-click login for demo / dev convenience
  const quickLogin = (emp) => {
    if (!emp) return;
    const sessionUser = {
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      role: emp.role || 'Member',
      avatar: emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=0070F3&color=fff`
    };

    const newSession = {
      token: 'volvi_demo_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      user: sessionUser,
      rememberMe: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    persistSession(newSession, true);
  };

  // Sign up new user
  const signup = async ({ fullName, email, password, role, avatar }) => {
    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existing = employees.find(e => (e.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    const passwordHash = await hashPassword(password);
    const userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0070F3&color=fff`;

    const newEmployee = addEmployee({
      fullName: cleanName,
      email: cleanEmail,
      role: role || 'Software Engineer',
      avatar: userAvatar,
      passwordHash
    });

    const sessionUser = {
      id: newEmployee.id,
      fullName: newEmployee.fullName,
      email: newEmployee.email,
      role: newEmployee.role,
      avatar: newEmployee.avatar
    };

    const newSession = {
      token: 'volvi_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      user: sessionUser,
      rememberMe: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    persistSession(newSession, true);
    return { success: true, user: sessionUser };
  };

  // Reset password flow
  const resetPassword = async (email, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const emp = employees.find(e => (e.email || '').toLowerCase() === cleanEmail);
    if (!emp) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    const newHash = await hashPassword(newPassword);
    updateEmployeeCredentials(cleanEmail, newHash);
    return { success: true };
  };

  // Change password for logged in user
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'You must be signed in to change your password.' };
    if (!currentPassword) return { success: false, error: 'Please enter your current password.' };
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };

    const currentEmp = employees.find(e => e.id === user.id);
    if (!currentEmp) return { success: false, error: 'User record not found.' };

    const currHash = await hashPassword(currentPassword);
    const expectedHash = currentEmp.passwordHash || DEFAULT_PASSWORD_HASH;

    if (currHash !== expectedHash && currentPassword !== DEFAULT_DEMO_PASSWORD) {
      return { success: false, error: 'Incorrect current password.' };
    }

    const newHash = await hashPassword(newPassword);
    updateEmployeeCredentials(user.email, newHash);
    return { success: true };
  };

  // Logout
  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  };

  // Keep authenticated user state synchronized with employees directory
  useEffect(() => {
    if (user && employees && employees.length > 0) {
      const activeEmp = employees.find(e => e.id === user.id || e.email?.toLowerCase() === user.email?.toLowerCase());
      if (activeEmp) {
        if ((activeEmp.role && activeEmp.role !== user.role) || (activeEmp.avatar && activeEmp.avatar !== user.avatar)) {
          setUser(prev => ({
            ...prev,
            role: activeEmp.role || prev.role,
            avatar: activeEmp.avatar || prev.avatar
          }));
        }
      }
    }
  }, [employees, user?.id, user?.email]);

  const isAdmin = Boolean(user && (user.role || '').toLowerCase() === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        session,
        loading,
        login,
        quickLogin,
        signup,
        resetPassword,
        changePassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};