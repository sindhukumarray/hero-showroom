const express = require('express');
const { register } = require('../controllers/authController');
const { validateRegister } = require('../validators/authValidator');

const router = express.Router();

// POST /api/auth/register - Register a new customer user
router.post('/register', validateRegister, register);

module.exports = router;
