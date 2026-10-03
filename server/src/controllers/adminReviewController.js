const reviewService = require('../services/reviewService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Admin Review Controller
 * Handles administrative review management, moderation, search, and status workflow.
 */

/**
 * List reviews with pagination, search, rating, and status filters
 * GET /api/admin/reviews
 */
const getReviews = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      status,
      rating,
      showroom,
      user,
      search,
      sort
    } = req.query;

    const result = await reviewService.getAdminReviews({
      page,
      limit,
      status,
      rating,
      showroom,
      user,
      search,
      sort
    });

    return sendSuccess(res, 'Admin reviews retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single review by ID with populated customer and showroom details
 * GET /api/admin/reviews/:id
 */
const getReviewById = async (req, res, next) => {
  try {
    const review = await reviewService.getAdminReviewById(req.params.id);
    if (!review) {
      return sendError(res, 'Review not found', [`No customer review found with ID '${req.params.id}'`], 404);
    }
    return sendSuccess(res, 'Review retrieved successfully', review, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Moderate review status and attach optional moderation note
 * PATCH /api/admin/reviews/:id/status
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { status, moderationNote } = req.body;
    const review = await reviewService.updateReviewStatus(req.params.id, status, moderationNote);
    return sendSuccess(
      res,
      `Review status updated to '${review.status}' successfully`,
      review,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  getReviewById,
  updateReviewStatus
};
