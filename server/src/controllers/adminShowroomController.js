const showroomService = require('../services/showroomService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Showroom Controller
 * Handles administrative Showroom CRUD, filtering, status, and referential deactivation operations.
 */

/**
 * List showrooms with pagination, advanced search, and administrative filters
 * GET /api/admin/showrooms
 */
const getShowrooms = async (req, res, next) => {
  try {
    const { page, limit, search, brand, city, showroomType, isActive, isVerified, sort } = req.query;
    const result = await showroomService.getAdminShowrooms({
      page,
      limit,
      search,
      brand,
      city,
      showroomType,
      isActive,
      isVerified,
      sort
    });
    return sendSuccess(res, 'Showrooms retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single showroom by ID with populated references
 * GET /api/admin/showrooms/:id
 */
const getShowroomById = async (req, res, next) => {
  try {
    const showroom = await showroomService.getShowroomById(req.params.id);
    if (!showroom) {
      return sendError(res, 'Showroom not found', [`No showroom found with ID '${req.params.id}'`], 404);
    }
    return sendSuccess(res, 'Showroom retrieved successfully', showroom, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new showroom in the catalogue
 * POST /api/admin/showrooms
 */
const createShowroom = async (req, res, next) => {
  try {
    const showroom = await showroomService.createShowroom(req.body);
    return sendSuccess(res, 'Showroom created successfully', showroom, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing showroom
 * PUT /api/admin/showrooms/:id
 */
const updateShowroom = async (req, res, next) => {
  try {
    const showroom = await showroomService.updateShowroom(req.params.id, req.body);
    return sendSuccess(res, 'Showroom updated successfully', showroom, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update showroom active/inactive status
 * PATCH /api/admin/showrooms/:id/status
 */
const updateShowroomStatus = async (req, res, next) => {
  try {
    const showroom = await showroomService.updateShowroomStatus(req.params.id, req.body.isActive);
    return sendSuccess(
      res,
      `Showroom ${showroom.isActive ? 'activated' : 'deactivated'} successfully`,
      showroom,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or safe-deactivate showroom if it has dependent records
 * DELETE /api/admin/showrooms/:id
 */
const deleteShowroom = async (req, res, next) => {
  try {
    const result = await showroomService.deleteShowroom(req.params.id);
    return sendSuccess(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowrooms,
  getShowroomById,
  createShowroom,
  updateShowroom,
  updateShowroomStatus,
  deleteShowroom
};
