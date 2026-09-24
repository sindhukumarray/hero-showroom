const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

// POST /api/auth/register - Register a new customer user
router.post('/register', validateRegister, register);

// POST /api/auth/login - Authenticate user and issue JWT access token
router.post('/login', validateLogin, login);

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', verifyToken, getMe);

// GET /api/auth/admin-test - Dedicated RBAC verification route (Admin-only)
router.get('/admin-test', verifyToken, requireRole(ROLES.ADMIN), (req, res) => {
  return sendSuccess(res, 'Admin access granted', {
    user: req.user
  });
});

module.exports = router;
