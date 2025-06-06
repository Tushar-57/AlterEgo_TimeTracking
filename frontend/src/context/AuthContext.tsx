import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithToken } from '../utils/auth';

interface User {
  name?: string;
  email: string;
  onboardingCompleted: boolean; // Added onboardingCompleted
}

interface AuthContextType {
  error: { status: number; message: string } | null;
  clearError: () => void;
  isAuthenticated: boolean;
  login: (token: string, userData?: User) => void;
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

  const login = (token: string, userData?: User) => {
    localStorage.setItem('jwtToken', token.trim());
    setState({
      isAuthenticated: true,
      loading: false,
      error: null,
      user: userData || null,
    });
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
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
      console.log('AuthContext: Starting token validation');
      const token = localStorage.getItem('jwtToken')?.trim();
      if (!token) {
        console.log('AuthContext: No token found');
        setState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          user: null,
        }));
        return false;
      }

      try {
        console.log('AuthContext: Sending /api/auth/validate request');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetchWithToken('http://localhost:8080/api/auth/validate', {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        console.log('AuthContext: Validate response received');
        const data = await response;
        if (data.valid === true) {
          console.log('AuthContext: Token valid, setting authenticated');
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
          console.warn('AuthContext: Token validation response invalid:', data);
          setState(prev => ({
            ...prev,
            loading: false,
            isAuthenticated: false,
            user: null,
            error: { status: 401, message: 'Invalid token' },
          }));
          localStorage.removeItem('jwtToken');
          navigate('/login', { replace: true });
          return false;
        }
      } catch (error: any) {
        console.error('AuthContext: Token validation error:', error.message);
        setState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          user: null,
          error: { status: error.message.includes('401') ? 401 : 500, message: 'Session expired. Please log in again.' },
        }));
        localStorage.removeItem('jwtToken');
        navigate('/login', { replace: true });
        return false;
      }
    };

    validateAuth().then(result => {
      console.log('AuthContext: Validation complete, result:', result);
    });
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