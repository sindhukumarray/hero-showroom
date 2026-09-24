import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { TOKEN_STORAGE_KEY } from '../services/api';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider
 * Manages user authentication state, token persistence, and session lifecycle.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refreshes the active user's profile from the backend session endpoint
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      const freshUser = res?.data?.user || res?.user || null;
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      if (err?.statusCode === 401) {
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // Ignore storage failures
        }
        setUser(null);
        setToken(null);
      }
      throw err;
    }
  }, []);

  /**
   * Session Initialization: Restore authenticated session if a valid token exists
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      let storedToken = null;
      try {
        storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        storedToken = null;
      }

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setToken(storedToken);
        }
        const res = await authService.getCurrentUser();
        if (isMounted) {
          const authenticatedUser = res?.data?.user || res?.user || null;
          setUser(authenticatedUser);
        }
      } catch {
        // If token verification fails (401 or invalid), clear stored token
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // Ignore
        }
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login handler
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  const login = useCallback(async ({ email, password }) => {
    const res = await authService.login({ email, password });
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const authenticatedUser = res?.data?.user || res?.user;

    if (accessToken) {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      } catch {
        // Safe fallback
      }
      setToken(accessToken);
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
    }

    return res;
  }, []);

  /**
   * Register handler
   * @param {object} registrationData
   */
  const register = useCallback(async ({ name, email, password, phone }) => {
    return await authService.register({ name, email, password, phone });
  }, []);

  /**
   * Logout handler
   * Acknowledges session termination on backend and wipes local session state
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Regardless of backend response, always clear client session
    } finally {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Safe fallback
      }
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to consume authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
