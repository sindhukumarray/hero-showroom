const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { publicWriteLimiter } = require('../middleware/rateLimiter');
const testRideController = require('../controllers/testRideController');
const { validateCreateTestRide } = require('../validators/testRideValidator');

const router = express.Router();

/**
 * Test Ride Routes
 * Base: /api/test-rides
 */

// POST /api/test-rides - Customer books a test ride appointment (rate-limited)
router.post('/', publicWriteLimiter, verifyToken, validateCreateTestRide, testRideController.createTestRide);

// GET /api/test-rides/my - Authenticated customer retrieves their own test ride requests
router.get('/my', verifyToken, testRideController.getMyTestRides);

module.exports = router;
