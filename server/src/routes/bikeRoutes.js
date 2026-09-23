const express = require('express');
const { getBikes, getBikeBySlug } = require('../controllers/bikeController');
const { getBikeVariants } = require('../controllers/bikeVariantController');
const { validateBikeQuery, validateBikeSlug } = require('../validators/bikeValidator');
const { validateBikeVariantQuery } = require('../validators/bikeVariantValidator');

const router = express.Router();

// GET /api/bikes - list bikes with filtering and pagination
router.get('/', validateBikeQuery, getBikes);

// GET /api/bikes/:slug/variants - retrieve variants for a bike model (precedes /:slug)
router.get('/:slug/variants', validateBikeVariantQuery, getBikeVariants);

// GET /api/bikes/:slug - retrieve single bike model details
router.get('/:slug', validateBikeSlug, getBikeBySlug);

module.exports = router;
