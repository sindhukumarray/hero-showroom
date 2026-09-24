import api from './api';

/**
 * Frontend Authentication API Service
 * Encapsulates all backend authentication and session endpoints.
 */

/**
 * Register a new customer account
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.phone]
 * @returns {Promise<{ success: boolean, message: string, data: { user: object } }>}
 */
export const register = async ({ name, email, password, phone }) => {
  const payload = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password
  };

  if (phone && phone.trim()) {
    payload.phone = phone.trim();
  }

  return await api.post('/auth/register', payload);
};

/**
 * Authenticate user and issue JWT access token
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ success: boolean, message: string, data: { accessToken: string, user: object } }>}
 */
export const login = async ({ email, password }) => {
  return await api.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password
  });
};

/**
 * Retrieve currently authenticated user profile
 * @returns {Promise<{ success: boolean, message: string, data: { user: object } }>}
 */
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

/**
 * Terminate user authentication session on backend
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const logout = async () => {
  return await api.post('/auth/logout');
};

export default {
  register,
  login,
  getCurrentUser,
  logout
};
