/**
 * api.js — Reusable API Client Helper
 *
 * Wraps browser fetch() to automatically attach Bearer token, handle JSON
 * payloads, parse standardised API responses, and handle HTTP errors.
 */

const API = {
  /**
   * Generic request dispatcher
   *
   * @param {string} endpoint - e.g. '/careers', '/assessment', '/auth/login'
   * @param {Object} options - { method, body, auth, query }
   * @returns {Promise<Object>} API JSON payload
   */
  async request(endpoint, { method = 'GET', body = null, auth = false, query = null } = {}) {
    const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
    let url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Append query parameters if provided
    if (query && typeof query === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Attach JWT Bearer token if required
    if (auth) {
      const token = window.Auth?.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchConfig = {
      method: method.toUpperCase(),
      headers,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(fetchConfig.method)) {
      fetchConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP ${response.status} ${response.statusText}`,
      }));

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        if (auth && window.Auth?.isAuthenticated()) {
          console.warn('Session expired or invalid token — logging out');
          window.Auth.logout();
        }
      }

      if (!response.ok) {
        const error = new Error(data.message || 'API request failed');
        error.status = response.status;
        error.errors = data.errors || [];
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw structured error for catch blocks in UI scripts
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkErr = new Error('Cannot connect to backend server. Please make sure the server is running on port 5000.');
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  },

  // Convenience verbs
  get(endpoint, { auth = false, query = null } = {}) {
    return this.request(endpoint, { method: 'GET', auth, query });
  },

  post(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'POST', body, auth });
  },

  put(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'PUT', body, auth });
  },

  patch(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'PATCH', body, auth });
  },

  delete(endpoint, { auth = false } = {}) {
    return this.request(endpoint, { method: 'DELETE', auth });
  },
};

window.API = API;
