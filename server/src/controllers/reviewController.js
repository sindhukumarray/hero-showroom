const reviewService = require('../services/reviewService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isValidObjectId } = require('../validators/reviewValidator');

/**
 * Controller: Create a customer review for a showroom
 * POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after moderation.',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get approved reviews for a showroom (public)
 * GET /api/reviews/showroom/:showroomId
 */
const getShowroomReviews = async (req, res, next) => {
  try {
    const { showroomId } = req.params;

    if (!isValidObjectId(showroomId)) {
      return sendError(res, "Invalid showroom ID format", ["'showroomId' must be a valid MongoDB ObjectId."], 400);
    }

    const { page, limit } = req.query;
    const result = await reviewService.getShowroomReviews(showroomId, { page, limit });

    return sendSuccess(res, 'Showroom reviews retrieved successfully', result.data, 200, {
      ...result.meta,
      aggregation: result.aggregation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get authenticated customer's own reviews
 * GET /api/reviews/my
 */
const getMyReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getUserReviews(req.user.id, { page, limit });

    return sendSuccess(res, 'Your reviews retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get a single review by ID
 * GET /api/reviews/:id
 */
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, "Invalid review ID format", ["'id' must be a valid MongoDB ObjectId."], 400);
    }

    // Pass requesting user ID for ownership check (null if unauthenticated)
    const requestingUserId = req.user ? req.user.id : null;
    const review = await reviewService.getReviewById(id, requestingUserId);

    return sendSuccess(res, 'Review retrieved successfully', review, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update the authenticated customer's own review
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, "Invalid review ID format", ["'id' must be a valid MongoDB ObjectId."], 400);
    }

    const review = await reviewService.updateReview(req.user.id, id, req.body);

    return sendSuccess(res, 'Review updated successfully. It will re-enter moderation.', review, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete the authenticated customer's own review
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, "Invalid review ID format", ["'id' must be a valid MongoDB ObjectId."], 400);
    }

    await reviewService.deleteReview(req.user.id, id);

    return sendSuccess(res, 'Review deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getShowroomReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview
};
