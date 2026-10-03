const bikeVariantService = require('../services/bikeVariantService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Bike Variant Controller
 * Handles administrative Bike Variant CRUD, parent relationship enforcement, and referential deactivation.
 */

/**
 * List variants for a parent bike with pagination, search, and administrative filters
 * GET /api/admin/bikes/:bikeId/variants
 */
const getVariants = async (req, res, next) => {
  try {
    const { page, limit, search, minPrice, maxPrice, isActive, sort } = req.query;
    const result = await bikeVariantService.getAdminBikeVariants(req.params.bikeId, {
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      isActive,
      sort
    });

    return sendSuccess(res, 'Bike variants retrieved successfully', result.data, 200, {
      ...result.meta,
      bike: result.bike
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single variant by ID belonging to parent bike
 * GET /api/admin/bikes/:bikeId/variants/:variantId
 */
const getVariantById = async (req, res, next) => {
  try {
    const variant = await bikeVariantService.getBikeVariantById(req.params.bikeId, req.params.variantId);
    return sendSuccess(res, 'Bike variant retrieved successfully', variant, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new variant for a bike model
 * POST /api/admin/bikes/:bikeId/variants
 */
const createVariant = async (req, res, next) => {
  try {
    const variant = await bikeVariantService.createBikeVariant(req.params.bikeId, req.body);
    return sendSuccess(res, 'Bike variant created successfully', variant, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        'A variant with this slug already exists for this bike.',
        ['Duplicate variant slug constraint violation.'],
        400
      );
    }
    next(error);
  }
};

/**
 * Update an existing bike variant
 * PUT /api/admin/bikes/:bikeId/variants/:variantId
 */
const updateVariant = async (req, res, next) => {
  try {
    const variant = await bikeVariantService.updateBikeVariant(
      req.params.bikeId,
      req.params.variantId,
      req.body
    );
    return sendSuccess(res, 'Bike variant updated successfully', variant, 200);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        'A variant with this slug already exists for this bike.',
        ['Duplicate variant slug constraint violation.'],
        400
      );
    }
    next(error);
  }
};

/**
 * Update variant active status specifically
 * PATCH /api/admin/bikes/:bikeId/variants/:variantId/status
 */
const updateVariantStatus = async (req, res, next) => {
  try {
    const variant = await bikeVariantService.updateBikeVariantStatus(
      req.params.bikeId,
      req.params.variantId,
      req.body.isActive
    );
    return sendSuccess(
      res,
      `Bike variant ${variant.isActive ? 'activated' : 'deactivated'} successfully`,
      variant,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or safely deactivate variant if referenced by leads, test rides, or offers
 * DELETE /api/admin/bikes/:bikeId/variants/:variantId
 */
const deleteVariant = async (req, res, next) => {
  try {
    const result = await bikeVariantService.deleteBikeVariant(req.params.bikeId, req.params.variantId);
    return sendSuccess(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  updateVariantStatus,
  deleteVariant
};
