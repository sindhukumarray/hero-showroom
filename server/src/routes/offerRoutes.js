const express = require('express');
const offerController = require('../controllers/offerController');
const { validateGetOffers } = require('../validators/offerValidator');

const router = express.Router();

/**
 * Public Routes for Offers
 */
router.get('/', validateGetOffers, offerController.getOffers);
router.get('/:idOrSlug', offerController.getOfferByIdOrSlug);

module.exports = router;
