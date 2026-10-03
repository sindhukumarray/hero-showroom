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

/**
 * ============================================================
 * Admin Showrooms Management
 * ============================================================
 */

/**
 * Retrieve paginated showrooms for administration
 * @param {object} [params] Query filters: { page, limit, search, brand, city, showroomType, isActive, isVerified, sort }
 * @returns {Promise<object>} { success, data, meta }
 */
export const getShowrooms = async (params = {}) => {
  return await api.get('/admin/showrooms', { params });
};

/**
 * Retrieve single showroom by MongoDB ID
 * @param {string} id - 24-character hex ObjectId
 * @returns {Promise<object>} { success, data }
 */
export const getShowroom = async (id) => {
  return await api.get(`/admin/showrooms/${id}`);
};

/**
 * Create a new showroom
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const createShowroom = async (payload) => {
  return await api.post('/admin/showrooms', payload);
};

/**
 * Update an existing showroom
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const updateShowroom = async (id, payload) => {
  return await api.put(`/admin/showrooms/${id}`, payload);
};

/**
 * Toggle or set showroom active status specifically
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>} { success, data }
 */
export const updateShowroomStatus = async (id, isActive) => {
  return await api.patch(`/admin/showrooms/${id}/status`, { isActive });
};

/**
 * Delete or safe-deactivate a showroom
 * @param {string} id
 * @returns {Promise<object>} { success, message, data: { deleted, deactivated, message, showroom } }
 */
export const deleteShowroom = async (id) => {
  return await api.delete(`/admin/showrooms/${id}`);
};

/**
 * ============================================================
 * Admin Bikes Management
 * ============================================================
 */

/**
 * Retrieve paginated bikes for administration
 * @param {object} [params] Query filters: { page, limit, search, brand, category, fuelType, transmission, minPrice, maxPrice, isActive, isFeatured, sort }
 * @returns {Promise<object>} { success, data, meta }
 */
export const getBikes = async (params = {}) => {
  return await api.get('/admin/bikes', { params });
};

/**
 * Retrieve single bike by MongoDB ID
 * @param {string} id - 24-character hex ObjectId
 * @returns {Promise<object>} { success, data }
 */
export const getBike = async (id) => {
  return await api.get(`/admin/bikes/${id}`);
};

/**
 * Create a new bike
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const createBike = async (payload) => {
  return await api.post('/admin/bikes', payload);
};

/**
 * Update an existing bike
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const updateBike = async (id, payload) => {
  return await api.put(`/admin/bikes/${id}`, payload);
};

/**
 * Toggle or set bike active status specifically
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>} { success, data }
 */
export const updateBikeStatus = async (id, isActive) => {
  return await api.patch(`/admin/bikes/${id}/status`, { isActive });
};

/**
 * Delete or safe-deactivate a bike
 * @param {string} id
 * @returns {Promise<object>} { success, message, data: { deleted, deactivated, message, bike } }
 */
export const deleteBike = async (id) => {
  return await api.delete(`/admin/bikes/${id}`);
};

/**
 * ============================================================
 * Admin Bike Variants Management
 * ============================================================
 */

/**
 * Retrieve paginated variants belonging to a specific bike
 * @param {string} bikeId - 24-character hex ObjectId
 * @param {object} [params] Query filters: { page, limit, search, minPrice, maxPrice, isActive, sort }
 * @returns {Promise<object>} { success, data, meta }
 */
export const getBikeVariants = async (bikeId, params = {}) => {
  return await api.get(`/admin/bikes/${bikeId}/variants`, { params });
};

/**
 * Retrieve single variant by ID belonging to parent bike
 * @param {string} bikeId
 * @param {string} variantId
 * @returns {Promise<object>} { success, data }
 */
export const getBikeVariant = async (bikeId, variantId) => {
  return await api.get(`/admin/bikes/${bikeId}/variants/${variantId}`);
};

/**
 * Create a new variant for a bike
 * @param {string} bikeId
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const createBikeVariant = async (bikeId, payload) => {
  return await api.post(`/admin/bikes/${bikeId}/variants`, payload);
};

/**
 * Update an existing bike variant
 * @param {string} bikeId
 * @param {string} variantId
 * @param {object} payload
 * @returns {Promise<object>} { success, data }
 */
export const updateBikeVariant = async (bikeId, variantId, payload) => {
  return await api.put(`/admin/bikes/${bikeId}/variants/${variantId}`, payload);
};

/**
 * Toggle or set variant active status specifically
 * @param {string} bikeId
 * @param {string} variantId
 * @param {boolean} isActive
 * @returns {Promise<object>} { success, data }
 */
export const updateBikeVariantStatus = async (bikeId, variantId, isActive) => {
  return await api.patch(`/admin/bikes/${bikeId}/variants/${variantId}/status`, { isActive });
};

/**
 * Delete or safe-deactivate a bike variant
 * @param {string} bikeId
 * @param {string} variantId
 * @returns {Promise<object>} { success, message, data: { deleted, deactivated, message, variant } }
 */
export const deleteBikeVariant = async (bikeId, variantId) => {
  return await api.delete(`/admin/bikes/${bikeId}/variants/${variantId}`);
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
  deleteCity,
  getShowrooms,
  getShowroom,
  createShowroom,
  updateShowroom,
  updateShowroomStatus,
  deleteShowroom,
  getBikes,
  getBike,
  createBike,
  updateBike,
  updateBikeStatus,
  deleteBike,
  getBikeVariants,
  getBikeVariant,
  createBikeVariant,
  updateBikeVariant,
  updateBikeVariantStatus,
  deleteBikeVariant
};


