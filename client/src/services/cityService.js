import api from './api';

/**
 * City Catalogue API Service
 */
export const getCities = async (params = {}) => {
  return await api.get('/cities', { params });
};

export const getCityBySlug = async (slug) => {
  return await api.get(`/cities/${encodeURIComponent(slug)}`);
};

export default {
  getCities,
  getCityBySlug
};
