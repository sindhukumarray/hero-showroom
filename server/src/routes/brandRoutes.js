const express = require('express');
const { getBrands, getBrandBySlug } = require('../controllers/brandController');
const { validateBrandQuery, validateBrandSlug } = require('../validators/brandValidator');

const router = express.Router();

// GET /api/brands - list brands with pagination and filters
router.get('/', validateBrandQuery, getBrands);

// GET /api/brands/:slug - get brand details by slug
router.get('/:slug', validateBrandSlug, getBrandBySlug);

module.exports = router;
