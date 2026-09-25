const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');
const { validateCreateReview, validateUpdateReview } = require('../validators/reviewValidator');

const router = express.Router();

/**
 * Review Routes
 * Base: /api/reviews
 */

// PUBLIC: Get approved reviews + aggregation for a specific showroom
router.get('/showroom/:showroomId', reviewController.getShowroomReviews);

// PROTECTED: Get authenticated customer's own reviews
router.get('/my', verifyToken, reviewController.getMyReviews);

// PROTECTED: Submit a new review
router.post('/', verifyToken, validateCreateReview, reviewController.createReview);

// PROTECTED: Get a single review by ID (owner or approved)
router.get('/:id', verifyToken, reviewController.getReviewById);

// PROTECTED: Update own review
router.put('/:id', verifyToken, validateUpdateReview, reviewController.updateReview);

// PROTECTED: Delete own review
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
