const express = require('express');
const {
  getShowrooms,
  getShowroomBySlug,
  getNearbyShowrooms
} = require('../controllers/showroomController');
const {
  validateShowroomQuery,
  validateShowroomSlug,
  validateNearbyQuery
} = require('../validators/showroomValidator');

const router = express.Router();

// GET /api/showrooms - list showrooms with pagination and filtering
router.get('/', validateShowroomQuery, getShowrooms);

// GET /api/showrooms/nearby - geospatial radius discovery (must precede /:slug)
router.get('/nearby', validateNearbyQuery, getNearbyShowrooms);

// GET /api/showrooms/:slug - get showroom details by unique slug
router.get('/:slug', validateShowroomSlug, getShowroomBySlug);

module.exports = router;
