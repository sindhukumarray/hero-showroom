import api from './api';

/**
 * Brand Catalogue API Service
 */
export const getBrands = async (params = {}) => {
  return await api.get('/brands', { params });
};

export const getBrandBySlug = async (slug) => {
  return await api.get(`/brands/${encodeURIComponent(slug)}`);
};

export default {
  getBrands,
  getBrandBySlug
};
