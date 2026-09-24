const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const favoriteController = require('../controllers/favoriteController');
const { validateToggleFavorite } = require('../validators/favoriteValidator');

const router = express.Router();

/**
 * Favorite Routes
 * Base: /api/favorites
 * All routes require authentication.
 */

// POST /api/favorites/toggle - Add or remove a bike/showroom favorite
router.post('/toggle', verifyToken, validateToggleFavorite, favoriteController.toggleFavorite);

// GET /api/favorites/check - Check if entity is favorited (?entityType=bike&entityId=<id>)
router.get('/check', verifyToken, favoriteController.checkFavorite);

// GET /api/favorites/my - Retrieve authenticated customer's favorites (with optional ?entityType filter)
router.get('/my', verifyToken, favoriteController.getMyFavorites);

module.exports = router;
