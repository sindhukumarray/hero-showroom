const testRideService = require('../services/testRideService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Controller: Create a customer test ride booking
 * POST /api/test-rides
 */
const createTestRide = async (req, res, next) => {
  try {
    const { name, email, phone, showroom, bike, variant, preferredDate, preferredTime, notes } = req.body;

    const testRide = await testRideService.createTestRide({
      userId: req.user.id,
      name,
      email,
      phone,
      showroomId: showroom,
      bikeId: bike,
      variantId: variant,
      preferredDate,
      preferredTime,
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Test ride booking requested successfully',
      data: {
        testRide
      },
      testRide
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieve authenticated customer's own test rides
 * GET /api/test-rides/my
 */
const getMyTestRides = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await testRideService.getUserTestRides({
      userId: req.user.id,
      page,
      limit
    });

    return sendSuccess(res, 'User test rides retrieved successfully', result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTestRide,
  getMyTestRides
};
