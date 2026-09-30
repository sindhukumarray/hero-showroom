const brandService = require('../services/brandService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Brand Controller
 * Handles administrative Brand catalogue CRUD and status operations.
 */

/**
 * List brands with pagination and status filters (Admin)
 * GET /api/admin/brands
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
 * Retrieve single brand by ID (Admin)
 * GET /api/admin/brands/:id
 */
const getBrandById = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    return sendSuccess(res, 'Brand retrieved successfully', brand, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new brand (Admin)
 * POST /api/admin/brands
 */
const createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.body);
    return sendSuccess(res, 'Brand created successfully', brand, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing brand (Admin)
 * PUT /api/admin/brands/:id
 */
const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    return sendSuccess(res, 'Brand updated successfully', brand, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update active status of a brand (Admin)
 * PATCH /api/admin/brands/:id/status
 */
const updateBrandStatus = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrandStatus(req.params.id, req.body.isActive);
    return sendSuccess(
      res,
      `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`,
      brand,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or safe-deactivate brand (Admin)
 * DELETE /api/admin/brands/:id
 */
const deleteBrand = async (req, res, next) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    return sendSuccess(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
  deleteBrand
};
