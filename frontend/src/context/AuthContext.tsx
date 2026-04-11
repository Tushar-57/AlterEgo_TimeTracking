import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, markSessionActive, setStoredAuthToken, getStoredAuthToken, clearStoredAuthToken } from '../utils/auth';

interface User {
  name?: string;
  email: string;
  onboardingCompleted: boolean; // Added onboardingCompleted
}

interface AuthContextType {
  error: { status: number; message: string } | null;
  clearError: () => void;
  isAuthenticated: boolean;
  login: (userData?: User, token?: string | null) => void;
  logout: () => void;
  loading: boolean;
  user: User | null;
  setOnboardingCompleted: (completed: boolean) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  error: null,
  isAuthenticated: false,
  clearError: () => {},
  login: () => {},
  logout: () => {},
  loading: true,
  user: null,
  setOnboardingCompleted: () => {},
  token: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<{
    error: { status: number; message: string } | null;
    isAuthenticated: boolean;
    loading: boolean;
    user: User | null;
  }>({
    error: null,
    isAuthenticated: false,
    loading: true,
    user: null,
  });


  const login = (userData?: User, token?: string | null) => {
    markSessionActive();
    if (token) {
      setStoredAuthToken(token);
    }
    setState({
      isAuthenticated: true,
      loading: false,
      error: null,
      user: userData || null,
    });
  };

  const logout = () => {
    clearSession();
    clearStoredAuthToken();
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch((error) => {
      console.warn('Logout request failed:', error);
    });
    setState({
      isAuthenticated: false,
      loading: false,
      error: null,
      user: null,
    });
    navigate('/login', { replace: true });
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  const setOnboardingCompleted = (completed: boolean) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, onboardingCompleted: completed } : null,
    }));
  };

  useEffect(() => {
    // On mount, validate session via cookie only
    const validateAuth = async (): Promise<boolean> => {
      const setUnauthenticatedState = () => {
        setState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          user: null,
          error: null,
        }));
        clearSession();
        navigate('/login', { replace: true });
      };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.status === 401 || response.status === 403) {
          setUnauthenticatedState();
          return false;
        }
        if (!response.ok) {
          throw new Error(`Auth validation failed with status ${response.status}`);
        }
        const data = await response.json() as { valid: boolean; user: User };
        if (data.valid === true) {
          setState({
            isAuthenticated: true,
            loading: false,
            error: null,
            user: {
              email: data.user.email,
              name: data.user.name,
              onboardingCompleted: data.user.onboardingCompleted,
            },
          });
          return true;
        } else {
          setUnauthenticatedState();
          return false;
        }
      } catch (error: unknown) {
        setUnauthenticatedState();
        return false;
      }
    };
    validateAuth();
  }, [navigate]);

  const token = getStoredAuthToken();
  const value = { ...state, login, logout, clearError, setOnboardingCompleted, token };

  return (
    <AuthContext.Provider value={value}>
      {state.loading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);