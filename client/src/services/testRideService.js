import api from './api';

/**
 * Test Ride Service
 * Handles customer test ride booking requests and retrieval against /api/test-rides
 */

/**
 * Submit a customer test ride appointment request
 * @param {object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} [payload.phone]
 * @param {string} payload.showroom - Showroom MongoDB ObjectId
 * @param {string} payload.bike - Bike MongoDB ObjectId
 * @param {string} [payload.variant] - Optional BikeVariant MongoDB ObjectId
 * @param {string} payload.preferredDate - YYYY-MM-DD date string
 * @param {string} payload.preferredTime - HH:mm format time string
 * @param {string} [payload.notes]
 * @returns {Promise<object>} API response containing created test ride
 */
export const createTestRide = async (payload) => {
  return await api.post('/test-rides', payload);
};

/**
 * Retrieve authenticated customer's scheduled test rides
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} API response containing array of test rides and pagination metadata
 */
export const getMyTestRides = async (params = {}) => {
  return await api.get('/test-rides/my', { params });
};
