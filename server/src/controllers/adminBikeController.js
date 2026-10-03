const bikeService = require('../services/bikeService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Bike Controller
 * Handles administrative Bike catalogue CRUD, filtering, status, and referential deactivation operations.
 */

/**
 * List bikes with pagination, search, and administrative filters
 * GET /api/admin/bikes
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
      isFeatured,
      sort
    } = req.query;

    const result = await bikeService.getAdminBikes({
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
      isFeatured,
      sort
    });

    return sendSuccess(res, 'Bikes retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single bike by ID with populated brand details and variant count
 * GET /api/admin/bikes/:id
 */
const getBikeById = async (req, res, next) => {
  try {
    const bike = await bikeService.getBikeById(req.params.id);
    if (!bike) {
      return sendError(res, 'Bike not found', [`No bike model found with ID '${req.params.id}'`], 404);
    }
    return sendSuccess(res, 'Bike retrieved successfully', bike, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new bike model in the catalogue
 * POST /api/admin/bikes
 */
const createBike = async (req, res, next) => {
  try {
    const bike = await bikeService.createBike(req.body);
    return sendSuccess(res, 'Bike created successfully', bike, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'A bike with this slug already exists.', ['Duplicate slug constraint violation.'], 400);
    }
    next(error);
  }
};

/**
 * Update an existing bike model
 * PUT /api/admin/bikes/:id
 */
const updateBike = async (req, res, next) => {
  try {
    const bike = await bikeService.updateBike(req.params.id, req.body);
    return sendSuccess(res, 'Bike updated successfully', bike, 200);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'A bike with this slug already exists.', ['Duplicate slug constraint violation.'], 400);
    }
    next(error);
  }
};

/**
 * Update bike active status specifically
 * PATCH /api/admin/bikes/:id/status
 */
const updateBikeStatus = async (req, res, next) => {
  try {
    const bike = await bikeService.updateBikeStatus(req.params.id, req.body.isActive);
    return sendSuccess(
      res,
      `Bike ${bike.isActive ? 'activated' : 'deactivated'} successfully`,
      bike,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or safe-deactivate bike if it has dependent variants or records
 * DELETE /api/admin/bikes/:id
 */
const deleteBike = async (req, res, next) => {
  try {
    const result = await bikeService.deleteBike(req.params.id);
    return sendSuccess(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBikes,
  getBikeById,
  createBike,
  updateBike,
  updateBikeStatus,
  deleteBike
};
