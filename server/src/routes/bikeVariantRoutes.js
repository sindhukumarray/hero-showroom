const express = require('express');
const { getBikeVariants } = require('../controllers/bikeVariantController');
const { validateBikeVariantQuery } = require('../validators/bikeVariantValidator');

const router = express.Router({ mergeParams: true });

// Sub-router handlers for bike variants
router.get('/', validateBikeVariantQuery, getBikeVariants);
router.get('/:slug/variants', validateBikeVariantQuery, getBikeVariants);

module.exports = router;
