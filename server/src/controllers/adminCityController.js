const cityService = require('../services/cityService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Admin City Controller
 * Handles administrative City catalogue CRUD and status operations.
 */

/**
 * List cities with pagination and status filters (Admin)
 * GET /api/admin/cities
 */
const getCities = async (req, res, next) => {
  try {
    const { page, limit, search, state, isActive } = req.query;
    const result = await cityService.getCities({ page, limit, search, state, isActive });
    return sendSuccess(res, 'Cities retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single city by ID (Admin)
 * GET /api/admin/cities/:id
 */
const getCityById = async (req, res, next) => {
  try {
    const city = await cityService.getCityById(req.params.id);
    return sendSuccess(res, 'City retrieved successfully', city, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new city (Admin)
 * POST /api/admin/cities
 */
const createCity = async (req, res, next) => {
  try {
    const city = await cityService.createCity(req.body);
    return sendSuccess(res, 'City created successfully', city, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing city (Admin)
 * PUT /api/admin/cities/:id
 */
const updateCity = async (req, res, next) => {
  try {
    const city = await cityService.updateCity(req.params.id, req.body);
    return sendSuccess(res, 'City updated successfully', city, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update active status of a city (Admin)
 * PATCH /api/admin/cities/:id/status
 */
const updateCityStatus = async (req, res, next) => {
  try {
    const city = await cityService.updateCityStatus(req.params.id, req.body.isActive);
    return sendSuccess(
      res,
      `City ${city.isActive ? 'activated' : 'deactivated'} successfully`,
      city,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or safe-deactivate city (Admin)
 * DELETE /api/admin/cities/:id
 */
const deleteCity = async (req, res, next) => {
  try {
    const result = await cityService.deleteCity(req.params.id);
    return sendSuccess(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getCityById,
  createCity,
  updateCity,
  updateCityStatus,
  deleteCity
};
