const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const router = express.Router();

// POST /api/auth/register - Register a new customer user
router.post('/register', validateRegister, register);

// POST /api/auth/login - Authenticate user and issue JWT access token
router.post('/login', validateLogin, login);

module.exports = router;
