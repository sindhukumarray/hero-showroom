const brandService = require('../services/brandService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Controller to list brands with pagination and filters
 * GET /api/brands
 */
const getBrands = async (req, res, next) => {
  try {
    const { page, limit, search, isActive } = req.query;
    const result = await brandService.getBrands({ page, limit, search, isActive });

    return sendSuccess(res, 'Brands retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single brand by slug
 * GET /api/brands/:slug
 */
const getBrandBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const brand = await brandService.getBrandBySlug(slug);

    if (!brand) {
      return sendError(res, 'Brand not found', [`No brand found with slug '${slug}'`], 404);
    }

    return sendSuccess(res, 'Brand retrieved successfully', brand, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrandBySlug
};
