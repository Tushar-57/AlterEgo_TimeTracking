// import React, {  createContext,  useContext,  useState,  useEffect,} from 'react';
// import { fetchWithToken } from '../utils/auth';

// interface AuthContextType {
//   error: { status: number; message: string } | null;
//   clearError: () => void;
//   isAuthenticated: boolean;
//   login: (token: string) => void;
//   logout: () => void;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   error: null,
//   isAuthenticated: false,
//   clearError: () => {},
//   login: () => {},
//   logout: () => {},
//   loading: true,
// });
// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [state, setState] = useState<{
//     error: { status: number; message: string } | null;
//     isAuthenticated: boolean;
//     loading: boolean;
//   }>({
//    error: null,
//     isAuthenticated: false,
//     loading: true,
//   });

//   const login = (token: string) => {
//     localStorage.setItem('jwtToken', token); // Store token
//     setState({ isAuthenticated: true, loading: false, error: null });
//   };

//   const logout = () => {
//     localStorage.removeItem('jwtToken');
//     setState({ isAuthenticated: false, loading: false, error: null });
//   };

//   const clearError = () => setState({ ...state, error: null }); // Keep this as it only updates error

//   useEffect(() => {
//     const validateAuth = async () => {
//       const token = localStorage.getItem('jwtToken');
//       if (token) {
//         try {
//           await fetchWithToken('/api/auth/validate'); // Hits new endpoint
//           setState({ isAuthenticated: true, loading: false, error: null });
//         } catch (err) {
//           localStorage.removeItem('jwtToken');
//           setState({ ...state, loading: false });
//         }
//       } else {
//         setState({ ...state, loading: false });
//       }
//     };
//     validateAuth();
//   }, []);


//   const value = { ...state, login, logout, clearError };

//   return <AuthContext.Provider value={value as AuthContextType}>{children}</AuthContext.Provider>;
// };
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  error: { status: number; message: string } | null;
  clearError: () => void;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  error: null,
  isAuthenticated: false,
  clearError: () => {},
  login: () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<{
    error: { status: number; message: string } | null;
    isAuthenticated: boolean;
    loading: boolean;
  }>({
    error: null,
    isAuthenticated: false,
    loading: true,
  });

  const login = (token: string) => {
    localStorage.setItem('jwtToken', token);
    setState({ isAuthenticated: true, loading: false, error: null });
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setState({ isAuthenticated: false, loading: false, error: null });
    navigate('/login'); // Add explicit navigation
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('jwtToken')?.trim(); // Add trim()
      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
  
      try {
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}` // Explicit header
          }
        });
        if (response.ok) {
          setState(prev => ({ ...prev, isAuthenticated: true, loading: false }));
        } else {
          throw new Error('Invalid token');
        }
      } catch (err) {
        localStorage.removeItem('jwtToken');
        setState(prev => ({ ...prev, isAuthenticated: false, loading: false }));
        // Add timeout to prevent navigation during render
        setTimeout(() => navigate('/login', { replace: true }), 0);
      }
    };
  
    validateAuth();
  }, [navigate]); // Keep navigate as dependency
  const value = { ...state, login, logout, clearError };

  return <AuthContext.Provider value={value as AuthContextType}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

