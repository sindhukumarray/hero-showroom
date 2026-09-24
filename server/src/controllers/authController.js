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

module.exports = {
  register
};
