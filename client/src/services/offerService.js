import api from './api';

/**
 * Service: Retrieve public promotional offers with optional filters.
 * @param {object} params Filter options (bike, showroom, offerType, page, limit, active, sort)
 * @returns {Promise<object>} API response containing offers array and pagination meta
 */
export const getOffers = async (params = {}) => {
  const response = await api.get('/offers', { params });
  return response;
};

/**
 * Service: Retrieve single offer details by MongoDB ID or slug.
 * @param {string} idOrSlug Offer ObjectId or unique slug identifier
 * @returns {Promise<object>} API response containing offer details
 */
export const getOffer = async (idOrSlug) => {
  const response = await api.get(`/offers/${idOrSlug}`);
  return response;
};

export default {
  getOffers,
  getOffer
};
