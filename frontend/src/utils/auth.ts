// utils/auth.ts
export const API_URL = 'http://localhost:8080/api';

export const login = async (credentials: any) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || 'Login failed');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Login Error:', error);
    throw error; // Re-throw the error for the calling function to handle
  }
};

export const signup = async (credentials: any) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || 'Signup failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup Error:', error);
    throw error; // Re-throw the error for the calling function to handle
  }
};

export const logout = () => {
  localStorage.removeItem('jwtToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('jwtToken');
};

// export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
//   const token = localStorage.getItem('jwtToken'); // Ensure token exists
//   const headers = {
//     ...options.headers,
//     'Content-Type': 'application/json',
//     ...(token && { Authorization: `Bearer ${token}` }),
//   };

//   const response = await fetch(url, { ...options, headers });

//   if (!response.ok) {
//     const errorData = await response.json();
//     throw { status: response.status, message: errorData.message || 'Request failed' };
//   }

//   return response;
// };
export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('jwtToken');
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};