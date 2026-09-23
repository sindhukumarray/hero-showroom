import axios from 'axios';

/**
 * Centralized Axios API Client
 * Configured with base URL, standard headers, timeouts, and error interceptors.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request Interceptor: Attach authentication or trace tokens in future phases
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalize responses and standardize error structures
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const formattedError = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
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
