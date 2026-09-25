import api from './api';

/**
 * Review Service
 * Handles showroom review submission and retrieval against /api/reviews
 */

/**
 * Fetch approved reviews + rating aggregation for a showroom (public)
 * @param {string} showroomId - MongoDB ObjectId
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} API response with data, meta, and meta.aggregation
 */
export const getShowroomReviews = async (showroomId, params = {}) => {
  return await api.get(`/reviews/showroom/${showroomId}`, { params });
};

/**
 * Submit a review for a showroom (authenticated)
 * @param {object} payload
 * @param {string} payload.showroom - Showroom MongoDB ObjectId
 * @param {number} payload.rating - Integer 1-5
 * @param {string} [payload.title]
 * @param {string} [payload.comment]
 * @returns {Promise<object>} Created review
 */
export const createReview = async (payload) => {
  return await api.post('/reviews', payload);
};

/**
 * Retrieve authenticated customer's own reviews
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} API response with array of reviews and pagination metadata
 */
export const getMyReviews = async (params = {}) => {
  return await api.get('/reviews/my', { params });
};

/**
 * Get a single review by ID (authenticated; owner or approved)
 * @param {string} reviewId
 * @returns {Promise<object>}
 */
export const getReviewById = async (reviewId) => {
  return await api.get(`/reviews/${reviewId}`);
};

/**
 * Update the authenticated customer's own review
 * @param {string} reviewId
 * @param {object} payload - { rating?, title?, comment? }
 * @returns {Promise<object>}
 */
export const updateReview = async (reviewId, payload) => {
  return await api.put(`/reviews/${reviewId}`, payload);
};

/**
 * Delete the authenticated customer's own review
 * @param {string} reviewId
 * @returns {Promise<object>}
 */
export const deleteReview = async (reviewId) => {
  return await api.delete(`/reviews/${reviewId}`);
};
