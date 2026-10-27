import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useData } from './DataContext';
import {
  apiLogin,
  apiSignup,
  apiChangePassword,
  apiResetPassword
} from '../services/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'volvitech_auth_session';
const LEGACY_USER_KEY = 'tracker_user';

export const AuthProvider = ({ children }) => {
  const { employees, updateEmployee } = useData();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on app load
  useEffect(() => {
    try {
      // Check localStorage first, then sessionStorage
      let saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) {
        saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
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

  // Login via server API endpoint (/api/auth/login)
  const login = async (email, password, rememberMe = true) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const res = await apiLogin(cleanEmail, password);
      if (!res || !res.token || !res.user) {
        return { success: false, error: 'Authentication failed. Please check your credentials.' };
      }

      const isTargetAdmin = res.user.isAdmin !== undefined
        ? Boolean(res.user.isAdmin)
        : (res.user.role || '').toLowerCase() === 'admin';

      const sessionUser = {
        id: String(res.user.id),
        fullName: res.user.fullName,
        email: res.user.email,
        role: res.user.role || 'Member',
        avatar: res.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.fullName)}&background=0070F3&color=fff`,
        isAdmin: isTargetAdmin,
        userType: res.user.userType || 'internal',
        externalType: res.user.externalType || null,
        organization: res.user.organization || (res.user.userType === 'external' ? '' : 'Volvitech')
      };

      const newSession = {
        token: res.token,
        user: sessionUser,
        rememberMe,
        createdAt: Date.now(),
        expiresAt: rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null
      };

      persistSession(newSession, rememberMe);
      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  // Sign up via server API endpoint (/api/auth/signup)
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

    try {
      const res = await apiSignup({
        fullName: cleanName,
        email: cleanEmail,
        password,
        role,
        avatar
      });

      if (!res || !res.token || !res.user) {
        return { success: false, error: 'Failed to create user account.' };
      }

      const sessionUser = {
        id: String(res.user.id),
        fullName: res.user.fullName,
        email: res.user.email,
        role: res.user.role || 'Member',
        avatar: res.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.fullName)}&background=0070F3&color=fff`,
        isAdmin: false,
        userType: res.user.userType || 'internal',
        externalType: res.user.externalType || null,
        organization: res.user.organization || 'Volvitech'
      };

      const newSession = {
        token: res.token,
        user: sessionUser,
        rememberMe: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      };

      persistSession(newSession, true);
      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message || 'Account registration failed.' };
    }
  };

  // Reset password via server API endpoint (/api/auth/reset-password)
  const resetPassword = async (email, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      await apiResetPassword(cleanEmail, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  };

  // Change password for logged in user via server API endpoint (/api/auth/change-password)
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'You must be signed in to change your password.' };
    if (!currentPassword) return { success: false, error: 'Please enter your current password.' };
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };

    try {
      await apiChangePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to change password.' };
    }
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
      const activeEmp = employees.find(e => String(e.id) === String(user.id) || e.email?.toLowerCase() === user.email?.toLowerCase());
      if (activeEmp) {
        const empIsAdmin = activeEmp.isAdmin !== undefined
          ? Boolean(activeEmp.isAdmin)
          : (activeEmp.role || '').toLowerCase() === 'admin';

        const empUserType = activeEmp.userType || 'internal';
        const empExternalType = activeEmp.externalType || null;
        const empOrg = activeEmp.organization || (empUserType === 'external' ? '' : 'Volvitech');

        if ((activeEmp.role && activeEmp.role !== user.role) ||
            (activeEmp.avatar && activeEmp.avatar !== user.avatar) ||
            (empIsAdmin !== Boolean(user.isAdmin)) ||
            (empUserType !== user.userType) ||
            (empExternalType !== user.externalType) ||
            (empOrg !== user.organization)) {
          setUser(prev => ({
            ...prev,
            role: activeEmp.role || prev.role,
            avatar: activeEmp.avatar || prev.avatar,
            isAdmin: empIsAdmin,
            userType: empUserType,
            externalType: empExternalType,
            organization: empOrg
          }));
        }
      }
    }
  }, [employees, user?.id, user?.email, user?.role, user?.avatar, user?.isAdmin, user?.userType, user?.externalType, user?.organization]);

  // Update profile avatar
  const updateAvatar = useCallback((newAvatar) => {
    if (!user) return { success: false, error: 'User not signed in.' };
    const cleanAvatar = (newAvatar || '').trim();
    if (!cleanAvatar) return { success: false, error: 'Avatar cannot be empty.' };

    const updatedUser = {
      ...user,
      avatar: cleanAvatar
    };

    setUser(updatedUser);

    // Update active storage session
    try {
      let saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.user = updatedUser;
        if (localStorage.getItem(AUTH_STORAGE_KEY)) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(updatedUser));
    } catch {
      // Ignore serialization errors
    }

    // Update employee record across DataContext & Server API
    if (updateEmployee) {
      updateEmployee(user.id, { avatar: cleanAvatar });
    }

    return { success: true };
  }, [user, updateEmployee]);

  const isAdmin = Boolean(user && (user.isAdmin === true || (user.role || '').toLowerCase() === 'admin'));
  const isAccountant = Boolean(user && (user.role || '').toLowerCase().trim() === 'accountant');
  const canManageFinance = Boolean(isAdmin || isAccountant);
  const isProjectManager = Boolean(user && !isAdmin && (user.role || '').toLowerCase().trim() === 'project manager');
  const canManageProjects = Boolean(isAdmin || isProjectManager);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isAccountant,
        canManageFinance,
        isProjectManager,
        canManageProjects,
        session,
        loading,
        login,
        signup,
        resetPassword,
        changePassword,
        updateAvatar,
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