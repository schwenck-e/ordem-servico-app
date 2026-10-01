import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setStoredSession, clearStoredSession, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/lib/api';
import type { AuthUser, AuthResponse, LoginInput } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      apiClient<AuthUser>('/auth/me')
        .then((userData) => {
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        })
        .catch(() => {
          // If token is invalid or expired, 401 will trigger handleUnauthorized
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(async (credentials: LoginInput) => {
    const response = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    setStoredSession(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
