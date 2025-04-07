import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidToken } from '../utils/auth';
// const [loading, setLoading] = useState(true);
interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const defaultState: AuthContextType = {
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: true // Set initial loading to true
};

const AuthContext = createContext<AuthContextType>(defaultState);

// Export the hook properly
export const useAuth = () => useContext(AuthContext);

// Add refresh token storage
let refreshTokenRequest: Promise<string> | null = null;
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  

  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) throw new Error('Refresh failed');
      
      const { token, refreshToken: newRefreshToken } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      return token;
    } catch (error) {
      logout();
      return null;
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
  
      if (!token || !isValidToken(token)) {
        if (refreshToken && isValidToken(refreshToken)) {
          await refreshAuthToken();
        } else {
          throw new Error('No valid tokens');
        }
      }
  
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsAuthenticated(response.ok);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);