import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, fetchWithToken, markSessionActive } from '../utils/auth';

interface User {
  name?: string;
  email: string;
  onboardingCompleted: boolean; // Added onboardingCompleted
}

interface AuthContextType {
  error: { status: number; message: string } | null;
  clearError: () => void;
  isAuthenticated: boolean;
  login: (userData?: User) => void;
  logout: () => void;
  loading: boolean;
  user: User | null;
  setOnboardingCompleted: (completed: boolean) => void; // Added setOnboardingCompleted
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

  const login = (userData?: User) => {
    markSessionActive();
    setState({
      isAuthenticated: true,
      loading: false,
      error: null,
      user: userData || null,
    });
  };

  const logout = () => {
    clearSession();
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
    const validateAuth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const data = await fetchWithToken<{ valid: boolean; user: User }>('/api/auth/validate', {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (data.valid === true) {
          markSessionActive();
          setState({
            isAuthenticated: true,
            loading: false,
            error: null,
            user: {
              email: data.user.email,
              name: data.user.name,
              onboardingCompleted: data.user.onboardingCompleted, // Set onboardingCompleted
            },
          });
          return true;
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            isAuthenticated: false,
            user: null,
            error: { status: 401, message: 'Invalid token' },
          }));
          clearSession();
          return false;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Session expired. Please log in again.';
        console.warn('Auth validation failed:', message);
        setState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          user: null,
          error: { status: message.includes('401') ? 401 : 500, message: 'Session expired. Please log in again.' },
        }));
        clearSession();
        return false;
      }
    };

    validateAuth();
  }, [navigate]);

  const value = { ...state, login, logout, clearError, setOnboardingCompleted };

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