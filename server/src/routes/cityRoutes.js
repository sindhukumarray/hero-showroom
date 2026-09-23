const express = require('express');
const { getCities, getCityBySlug } = require('../controllers/cityController');
const { validateCityQuery, validateCitySlug } = require('../validators/cityValidator');

const router = express.Router();

// GET /api/cities - list cities with pagination and filters
router.get('/', validateCityQuery, getCities);

// GET /api/cities/:slug - get city details by slug
router.get('/:slug', validateCitySlug, getCityBySlug);

module.exports = router;
