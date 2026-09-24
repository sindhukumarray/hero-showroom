const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const leadController = require('../controllers/leadController');
const { validateCreateLead } = require('../validators/leadValidator');

const router = express.Router();

/**
 * Lead Routes
 * Base: /api/leads
 */

// POST /api/leads - Customer creates a new showroom / bike enquiry
router.post('/', verifyToken, validateCreateLead, leadController.createLead);

// GET /api/leads/my - Authenticated customer retrieves their own submitted leads
router.get('/my', verifyToken, leadController.getMyLeads);

module.exports = router;
