const offerService = require('../services/offerService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Controller: List promotional offers
 * GET /api/offers
 */
const getOffers = async (req, res, next) => {
  try {
    const result = await offerService.getOffers(req.query);
    return sendSuccess(res, 'Offers retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieve offer by ID or slug
 * GET /api/offers/:idOrSlug
 */
const getOfferByIdOrSlug = async (req, res, next) => {
  try {
    const identifier = req.params.idOrSlug || req.params.id || req.params.slug;
    const offer = await offerService.getOfferByIdOrSlug(identifier);
    return sendSuccess(res, 'Offer retrieved successfully', offer, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOffers,
  getOfferByIdOrSlug
};
