// // utils/auth.ts
// export const API_URL = 'http://localhost:8080/api';

// export const login = async (credentials: any) => {
//   try {
//     const response = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     });

//     if (!response.ok) {
//       const errorMessage = await response.text();
//       throw new Error(errorMessage || 'Login failed');
//     }

//     const data = await response.json();

//     return data;
//   } catch (error) {
//     console.error('Login Error:', error);
//     throw error; // Re-throw the error for the calling function to handle
//   }
// };

// export const signup = async (credentials: any) => {
//   try {
//     const response = await fetch(`${API_URL}/auth/signup`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     });

//     if (!response.ok) {
//       const errorMessage = await response.text();
//       throw new Error(errorMessage || 'Signup failed');
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Signup Error:', error);
//     throw error; // Re-throw the error for the calling function to handle
//   }
// };

// export const logout = () => {
//   localStorage.removeItem('jwtToken');
// };

// export const isAuthenticated = () => {
//   return !!localStorage.getItem('jwtToken');
// };

// export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
//   const token = localStorage.getItem('jwtToken');
//   const headers = new Headers(options.headers || {});
//   if (token) headers.set('Authorization', `Bearer ${token}`);
//   return fetch(url, { ...options, headers });
// };
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Signup failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Signup Error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('jwtToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('jwtToken');
};

// export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
//   const token = localStorage.getItem('jwtToken')?.trim();
//   const headers = new Headers(options.headers || {});
//   headers.set('Content-Type', 'application/json');
//   if (token) headers.set('Authorization', `Bearer ${token}`);

//   const response = await fetch(url, { ...options, headers });
  

//   if (!response.ok) {
//     const contentType = response.headers.get('content-type');
//     let errorData = {};
//     if (contentType?.includes('application/json')) {
//       errorData = await response.json().catch(() => ({}));
//     }
//     throw new Error( `Request failed with status ${response.status}`);
//   }

//   const contentType = response.headers.get('content-type');
//   if (contentType?.includes('application/json')) {
//     return response.json();
//   }
//   return response; // Return raw response for non-JSON content
// };
export const fetchWithToken = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('jwtToken')?.trim();
  const headers = new Headers(options.headers || {});

  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const errorData = contentType?.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => null);
      
      throw new Error(
        errorData?.message ||
        errorData?.error ||
        `Request to ${url} failed with status ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON response from ${url}, received ${contentType || 'unknown'}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw new Error(
      error instanceof Error
        ? error.message
        : `Network error occurred while fetching ${url}`
    );
  }
};