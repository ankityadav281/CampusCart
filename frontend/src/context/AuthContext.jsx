import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('cc_access_token')));

  const saveSession = useCallback((access, refresh, userData) => {
    if (access) localStorage.setItem('cc_access_token', access);
    if (refresh) localStorage.setItem('cc_refresh_token', refresh);
    if (userData) {
      localStorage.setItem('cc_user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_access_token');
    localStorage.removeItem('cc_refresh_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('cc_access_token');
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await authAPI.getProfile();
      localStorage.setItem('cc_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshProfile();
    const handleForcedLogout = () => logout();
    window.addEventListener('cc-auth-logout', handleForcedLogout);
    return () => window.removeEventListener('cc-auth-logout', handleForcedLogout);
  }, [refreshProfile, logout]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    saveSession(data.access, data.refresh, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authAPI.register(payload);
    saveSession(data.access, data.refresh, data.user);
    return data.user;
  };

  const registerShopkeeper = async (payload) => {
    const { data } = await authAPI.registerShopkeeper(payload);
    saveSession(data.access, data.refresh, data.user);
    return data.user;
  };

  const updateUserLocal = (updatedUser) => {
    localStorage.setItem('cc_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const roleUpper = user?.role ? String(user.role).trim().toUpperCase() : '';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: roleUpper === 'ADMIN',
        isShopOwner: roleUpper === 'SHOP_OWNER',
        isCustomer: roleUpper === 'CUSTOMER',
        login,
        register,
        registerShopkeeper,
        logout,
        refreshProfile,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
