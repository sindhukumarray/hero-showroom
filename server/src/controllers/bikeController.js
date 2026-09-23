const bikeService = require('../services/bikeService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Controller to list bikes with pagination, filtering, and stable sort
 * GET /api/bikes
 */
const getBikes = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      brand,
      category,
      fuelType,
      transmission,
      minPrice,
      maxPrice,
      isActive,
      sort
    } = req.query;

    const result = await bikeService.getBikes({
      page,
      limit,
      search,
      brand,
      category,
      fuelType,
      transmission,
      minPrice,
      maxPrice,
      isActive,
      sort
    });

    return sendSuccess(res, 'Bikes retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single bike by slug with populated brand information
 * GET /api/bikes/:slug
 */
const getBikeBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const bike = await bikeService.getBikeBySlug(slug);

    if (!bike) {
      return sendError(res, 'Bike not found', [`No bike model found with slug '${slug}'`], 404);
    }

    return sendSuccess(res, 'Bike retrieved successfully', bike, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBikes,
  getBikeBySlug
};
