/**
 * Disheera Technologies Inc.
 * Centralized API Client & Network Service
 * 
 * Features:
 * - Localhost + Live Cloud (api.disheera.site) Auto-Failover
 * - Bearer Token Header Injection
 * - Server Pre-Warming
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return 'https://api.disheera.site/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const CLOUD_API_URL = 'https://api.disheera.site/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: any;
  [key: string]: any;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('careerpath_token') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token') ||
                sessionStorage.getItem('careerpath_token') ||
                sessionStorage.getItem('token');
  if (token && token !== 'mock-token' && token.trim() !== '') {
    return token;
  }
  return null;
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('careerpath_user') ||
              localStorage.getItem('user') ||
              sessionStorage.getItem('careerpath_user') ||
              sessionStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isAbsolute = endpoint.startsWith('http');
  let url = isAbsolute ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const fetchConfig: RequestInit = {
    ...options,
    headers,
  };

  try {
    let res: Response;
    try {
      res = await fetch(url, fetchConfig);
    } catch (fetchErr) {
      // Graceful failover to live cloud backend if local server is down
      if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
        console.warn('⚠️ Local backend at localhost:5000 is offline. Failing over to live Disheera cloud cluster...');
        const cloudUrl = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000\/api/, CLOUD_API_URL);
        res = await fetch(cloudUrl, fetchConfig);
      } else {
        throw fetchErr;
      }
    }

    // Edge proxy 404 failover
    if (res && res.status === 404 && !url.includes('api.disheera.site')) {
      try {
        const cloudFallback = url.replace(/https?:\/\/[^/]+\/api/, CLOUD_API_URL);
        const fallbackRes = await fetch(cloudFallback, fetchConfig);
        if (fallbackRes.ok || fallbackRes.status !== 404) {
          res = fallbackRes;
        }
      } catch (_) {}
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}: Request failed`);
    }

    return {
      success: true,
      ...data,
    };
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  get: <T = any>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  warmup() {
    try {
      if (typeof window !== 'undefined') {
        fetch(`${API_BASE_URL.replace(/\/api\/?$/, '')}/health`, { method: 'GET', cache: 'no-store' })
          .catch(() => {});
      }
    } catch (_) {}
  }
};

// Prewarm backend automatically
if (typeof window !== 'undefined') {
  api.warmup();
}
