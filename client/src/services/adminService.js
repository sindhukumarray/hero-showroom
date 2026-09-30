import api from './api';

/**
 * Admin Service
 * Handles administrative verification, platform metrics, and administrative CRUD operations
 * for catalogue entities (Brands, Cities, etc.).
 */

/**
 * Verify administrative session and retrieve platform status
 * GET /api/admin/status
 * @returns {Promise<object>} API response { success, message, data }
 */
export const getAdminStatus = async () => {
  return await api.get('/admin/status');
};

/**
 * ============================================================
 * Admin Brands Management
 * ============================================================
 */

/**
 * Retrieve paginated brands for administration
 * @param {object} [params] Query filters: { page, limit, search, isActive }
 * @returns {Promise<object>} { success, data, meta }
 */
export const getBrands = async (params = {}) => {
  return await api.get('/admin/brands', { params });
};

/**
 * Retrieve single brand by MongoDB ID
 * @param {string} id - 24-character hex ObjectId
 * @returns {Promise<object>} { success, data }
 */
export const getBrand = async (id) => {
  return await api.get(`/admin/brands/${id}`);
};

/**
 * Create a new brand
 * @param {object} payload - { name, slug, description, originCountry, website, logo, isActive }
 * @returns {Promise<object>} { success, data }
 */
export const createBrand = async (payload) => {
  return await api.post('/admin/brands', payload);
};

/**
 * Update an existing brand
 * @param {string} id
 * @param {object} payload - Partial or full brand attributes
 * @returns {Promise<object>} { success, data }
 */
export const updateBrand = async (id, payload) => {
  return await api.put(`/admin/brands/${id}`, payload);
};

/**
 * Toggle or set brand active status specifically
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>} { success, data }
 */
export const updateBrandStatus = async (id, isActive) => {
  return await api.patch(`/admin/brands/${id}/status`, { isActive });
};

/**
 * Delete or safe-deactivate a brand
 * @param {string} id
 * @returns {Promise<object>} { success, message, data: { deleted, deactivated, message, brand } }
 */
export const deleteBrand = async (id) => {
  return await api.delete(`/admin/brands/${id}`);
};

/**
 * ============================================================
 * Admin Cities Management
 * ============================================================
 */

/**
 * Retrieve paginated cities for administration
 * @param {object} [params] Query filters: { page, limit, search, state, isActive }
 * @returns {Promise<object>} { success, data, meta }
 */
export const getCities = async (params = {}) => {
  return await api.get('/admin/cities', { params });
};

/**
 * Retrieve single city by MongoDB ID
 * @param {string} id - 24-character hex ObjectId
 * @returns {Promise<object>} { success, data }
 */
export const getCity = async (id) => {
  return await api.get(`/admin/cities/${id}`);
};

/**
 * Create a new city
 * @param {object} payload - { name, slug, state, country, tier, coordinates, isActive }
 * @returns {Promise<object>} { success, data }
 */
export const createCity = async (payload) => {
  return await api.post('/admin/cities', payload);
};

/**
 * Update an existing city
 * @param {string} id
 * @param {object} payload - Partial or full city attributes
 * @returns {Promise<object>} { success, data }
 */
export const updateCity = async (id, payload) => {
  return await api.put(`/admin/cities/${id}`, payload);
};

/**
 * Toggle or set city active status specifically
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>} { success, data }
 */
export const updateCityStatus = async (id, isActive) => {
  return await api.patch(`/admin/cities/${id}/status`, { isActive });
};

/**
 * Delete or safe-deactivate a city
 * @param {string} id
 * @returns {Promise<object>} { success, message, data: { deleted, deactivated, message, city } }
 */
export const deleteCity = async (id) => {
  return await api.delete(`/admin/cities/${id}`);
};

export default {
  getAdminStatus,
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  updateBrandStatus,
  deleteBrand,
  getCities,
  getCity,
  createCity,
  updateCity,
  updateCityStatus,
  deleteCity
};
