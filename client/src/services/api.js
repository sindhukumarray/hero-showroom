import axios from 'axios';

/**
 * Storage key for authenticated user's access token
 */
export const TOKEN_STORAGE_KEY = 'hero_showroom_access_token';

/**
 * Centralized Axios API Client
 * Configured with base URL, standard headers, timeouts, and error interceptors.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request Interceptor: Attach Bearer authentication token when present
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && token.trim()) {
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
      }
    } catch {
      // Safe fallback if localStorage access is denied
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalize responses, handle 401 token expiration, and standardize error structures
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const statusCode = error.response?.status || 500;

    // Clear stale or expired token on 401 Unauthorized responses
    if (statusCode === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Safe fallback
      }
    }

    const formattedError = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      statusCode,
      errors: error.response?.data?.errors || []
    };
    return Promise.reject(formattedError);
  }
);

/**
 * Foundation Health Check Request
 * Verifies backend connectivity against GET /api/health
 */
export const checkApiHealth = async () => {
  return await api.get('/health');
};

export default api;
