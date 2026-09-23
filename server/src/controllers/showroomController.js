const showroomService = require('../services/showroomService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Controller to list showrooms with pagination, filters, and stable sort
 * GET /api/showrooms
 */
const getShowrooms = async (req, res, next) => {
  try {
    const { page, limit, search, brand, city, showroomType, isActive, sort } = req.query;
    const result = await showroomService.getShowrooms({
      page,
      limit,
      search,
      brand,
      city,
      showroomType,
      isActive,
      sort
    });

    return sendSuccess(res, 'Showrooms retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single showroom by slug with populated relationships
 * GET /api/showrooms/:slug
 */
const getShowroomBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const showroom = await showroomService.getShowroomBySlug(slug);

    if (!showroom) {
      return sendError(res, 'Showroom not found', [`No showroom found with slug '${slug}'`], 404);
    }

    return sendSuccess(res, 'Showroom retrieved successfully', showroom, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get nearby showrooms based on geospatial coordinates
 * GET /api/showrooms/nearby
 */
const getNearbyShowrooms = async (req, res, next) => {
  try {
    const { lat, lng, maxDistance, limit, brand, showroomType, isActive } = req.query;
    const result = await showroomService.getNearbyShowrooms({
      lat,
      lng,
      maxDistance,
      limit,
      brand,
      showroomType,
      isActive
    });

    return sendSuccess(res, 'Nearby showrooms retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowrooms,
  getShowroomBySlug,
  getNearbyShowrooms
};
