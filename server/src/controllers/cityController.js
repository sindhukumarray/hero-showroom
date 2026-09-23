const cityService = require('../services/cityService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Controller to list cities with pagination and filters
 * GET /api/cities
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
 * Controller to get a single city by slug
 * GET /api/cities/:slug
 */
const getCityBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const city = await cityService.getCityBySlug(slug);

    if (!city) {
      return sendError(res, 'City not found', [`No city found with slug '${slug}'`], 404);
    }

    return sendSuccess(res, 'City retrieved successfully', city, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getCityBySlug
};
