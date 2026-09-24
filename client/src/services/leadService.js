import api from './api';

/**
 * Lead Service
 * Handles customer lead generation and retrieval against /api/leads
 */

/**
 * Submit a customer enquiry/lead
 * @param {object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} [payload.phone]
 * @param {string} payload.showroom - Showroom MongoDB ObjectId
 * @param {string} payload.bike - Bike MongoDB ObjectId
 * @param {string} [payload.variant] - Optional BikeVariant MongoDB ObjectId
 * @param {string} [payload.source='showroom'] - 'showroom' | 'bike' | 'offer' | 'test_ride'
 * @param {string} [payload.message]
 * @returns {Promise<object>} API response containing created lead
 */
export const createLead = async (payload) => {
  return await api.post('/leads', payload);
};

/**
 * Retrieve authenticated customer's submitted leads
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} API response containing array of leads and pagination metadata
 */
export const getMyLeads = async (params = {}) => {
  return await api.get('/leads/my', { params });
};
