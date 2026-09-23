import api from './api';

/**
 * Bike Catalogue API Service
 */
export const getBikes = async (params = {}) => {
  return await api.get('/bikes', { params });
};

export const getBikeBySlug = async (slug) => {
  return await api.get(`/bikes/${encodeURIComponent(slug)}`);
};

export const getBikeVariants = async (slug, params = {}) => {
  return await api.get(`/bikes/${encodeURIComponent(slug)}/variants`, { params });
};

export default {
  getBikes,
  getBikeBySlug,
  getBikeVariants
};
