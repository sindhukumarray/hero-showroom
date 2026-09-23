import api from './api';

/**
 * Showroom Discovery API Service
 */
export const getShowrooms = async (params = {}) => {
  return await api.get('/showrooms', { params });
};

export const getShowroomBySlug = async (slug) => {
  return await api.get(`/showrooms/${encodeURIComponent(slug)}`);
};

export const getNearbyShowrooms = async (params = {}) => {
  return await api.get('/showrooms/nearby', { params });
};

export default {
  getShowrooms,
  getShowroomBySlug,
  getNearbyShowrooms
};
