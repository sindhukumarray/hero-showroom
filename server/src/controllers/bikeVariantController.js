const bikeVariantService = require('../services/bikeVariantService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Controller to list variants for a specific bike model
 * GET /api/bikes/:slug/variants
 */
const getBikeVariants = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page, limit, minPrice, maxPrice, isActive, sort } = req.query;

    const result = await bikeVariantService.getBikeVariants(slug, {
      page,
      limit,
      minPrice,
      maxPrice,
      isActive,
      sort
    });

    if (!result) {
      return sendError(res, 'Bike not found', [`No bike model found with slug '${slug}'`], 404);
    }

    return sendSuccess(res, 'Bike variants retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBikeVariants
};
