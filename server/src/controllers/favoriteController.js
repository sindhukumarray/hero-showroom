const favoriteService = require('../services/favoriteService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Controller: Toggle a favorite (add or remove) for the authenticated customer
 * POST /api/favorites/toggle
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.body;

    const result = await favoriteService.toggleFavorite({
      userId: req.user.id,
      entityType,
      entityId
    });

    const message = result.favorited
      ? 'Added to favorites successfully'
      : 'Removed from favorites successfully';

    return sendSuccess(res, message, result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Check whether the authenticated customer has favorited a specific entity
 * GET /api/favorites/check?entityType=bike&entityId=<id>
 */
const checkFavorite = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        message: "Query parameters 'entityType' and 'entityId' are required",
        errors: []
      });
    }

    const result = await favoriteService.checkFavorite({
      userId: req.user.id,
      entityType: String(entityType).trim(),
      entityId: String(entityId).trim()
    });

    return sendSuccess(res, 'Favorite status retrieved', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieve authenticated customer's own favorites
 * GET /api/favorites/my
 */
const getMyFavorites = async (req, res, next) => {
  try {
    const { entityType, page, limit } = req.query;

    const result = await favoriteService.getUserFavorites({
      userId: req.user.id,
      entityType: entityType ? String(entityType).trim() : undefined,
      page,
      limit
    });

    return sendSuccess(res, 'Favorites retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFavorite,
  checkFavorite,
  getMyFavorites
};
