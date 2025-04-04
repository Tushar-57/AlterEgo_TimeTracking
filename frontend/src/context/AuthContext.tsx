import React, { createContext, useState, useContext, ReactNode, } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidToken } from '../utils/auth';
interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void; // Explicit token parameter
  logout: () => void;
}

const defaultState: AuthContextType = {
  isAuthenticated: false,
  login: (token: string) => {}, // Match interface
  logout: () => {}
};

const AuthContext = createContext<AuthContextType>(defaultState);

// Export the hook properly
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('authToken');
    return !!token && isValidToken(token); // Add token validation
  });

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true); // This triggers re-render
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };
  

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};