export const API_URL = '/api';

type AuthCredentials = {
  email: string;
  password: string;
  name?: string;
};

type AuthErrorPayload = {
  message?: string;
  error?: string;
};

const readAuthError = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return '';
  }
  const payload: unknown = await response.json().catch(() => ({}));
  if (!payload || typeof payload !== 'object') {
    return '';
  }
  const typedPayload = payload as AuthErrorPayload;
  if (typeof typedPayload.message === 'string' && typedPayload.message.trim()) {
    return typedPayload.message;
  }
  if (typeof typedPayload.error === 'string' && typedPayload.error.trim()) {
    return typedPayload.error;
  }
  return '';
};

const AUTH_TOKEN_KEY = 'auth_token';

export const markSessionActive = (): void => {};
export const clearSession = (): void => {};
export const hasActiveSession = (): boolean => false;

export const getStoredAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuthToken = (token: string): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    console.warn('Failed to store auth token');
  }
};

export const clearStoredAuthToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    console.warn('Failed to clear auth token');
  }
};


export const login = async (credentials: AuthCredentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorMessage = await readAuthError(response);
      throw new Error(errorMessage || 'Login failed');
    }
    return await response.json();
  } catch (error: unknown) {
    console.error('Login Error:', error);
    throw error instanceof Error ? error : new Error('Login failed');
  }
};

export const signup = async (credentials: AuthCredentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await readAuthError(response);
      throw new Error(errorMessage || 'Signup failed');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Signup Error:', error);
    throw error instanceof Error ? error : new Error('Signup failed');
  }
};


export const logout = () => {};


export const isAuthenticated = () => false;


export const fetchWithToken = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(options.headers || {});
  const token = getStoredAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const errorData: AuthErrorPayload | null = contentType?.includes('application/json')
        ? await response.json().catch(() => ({} as AuthErrorPayload))
        : null;
      const fallbackText = !contentType?.includes('application/json')
        ? await response.text().catch(() => null)
        : null;
      throw new Error(
        errorData?.message ||
          errorData?.error ||
          fallbackText ||
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
