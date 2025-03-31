// context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Default values for the context
const defaultState: AuthContextType = {
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultState);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
