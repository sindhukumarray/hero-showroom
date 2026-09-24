import api from './api';

/**
 * Favorite Service
 * Handles customer favorite toggle, status check, and retrieval against /api/favorites
 */

/**
 * Toggle a favorite for a bike or showroom.
 * Adds if not favorited, removes if already favorited.
 * @param {object} payload
 * @param {string} payload.entityType - 'bike' | 'showroom'
 * @param {string} payload.entityId   - MongoDB ObjectId of the entity
 * @returns {Promise<{ favorited: boolean, favorite: object|null }>}
 */
export const toggleFavorite = async ({ entityType, entityId }) => {
  return await api.post('/favorites/toggle', { entityType, entityId });
};

/**
 * Check whether the authenticated user has favorited a given entity.
 * @param {object} params
 * @param {string} params.entityType - 'bike' | 'showroom'
 * @param {string} params.entityId
 * @returns {Promise<{ favorited: boolean }>}
 */
export const checkFavorite = async ({ entityType, entityId }) => {
  return await api.get('/favorites/check', {
    params: { entityType, entityId }
  });
};

/**
 * Retrieve the authenticated customer's favorite list.
 * @param {object} [params]
 * @param {string} [params.entityType] - Optional filter: 'bike' | 'showroom'
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} API response with data array and pagination meta
 */
export const getMyFavorites = async (params = {}) => {
  return await api.get('/favorites/my', { params });
};

export default {
  toggleFavorite,
  checkFavorite,
  getMyFavorites
};
