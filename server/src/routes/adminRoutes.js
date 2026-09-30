const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const adminController = require('../controllers/adminController');

const router = express.Router();

/**
 * Admin Routes
 * Base: /api/admin
 * All routes mounted on this router require valid JWT and ADMIN role.
 */
router.use(verifyToken, requireRole(ROLES.ADMIN));

/**
 * GET /api/admin/status - Verify admin session and system readiness
 */
router.get('/status', adminController.getAdminStatus);

module.exports = router;
