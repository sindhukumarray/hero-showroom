const authService = require('../services/authService');

/**
 * Controller: Register a new customer account
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = await authService.registerUser({ name, email, password, phone });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user
      },
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Authenticate user and issue JWT access token
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user
      },
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get currently authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user
      },
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
