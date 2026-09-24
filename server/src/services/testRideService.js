const { TestRide, User, Showroom, Bike, BikeVariant } = require('../models');
const { isConnected } = require('../config/database');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !TestRide._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Service: Create a test ride booking request with full relationship validation.
 * @param {object} params
 * @returns {Promise<object>} Created populated test ride document
 */
const createTestRide = async ({
  userId,
  name,
  email,
  phone,
  showroomId,
  bikeId,
  variantId,
  preferredDate,
  preferredTime,
  notes = ''
}) => {
  assertDatabaseConnected();

  // 1. Verify authenticated user identity and account activity
  const user = await User.findById(userId);
  if (!user || user.isActive === false) {
    const error = new Error('Authenticated user account is inactive or not found');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify referenced showroom existence and operational status
  const showroom = await Showroom.findById(showroomId);
  if (!showroom) {
    const error = new Error('Showroom not found');
    error.statusCode = 404;
    throw error;
  }
  if (showroom.isActive === false) {
    const error = new Error('Showroom is currently inactive and cannot accept bookings');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify referenced bike model existence and active status
  const bike = await Bike.findById(bikeId);
  if (!bike) {
    const error = new Error('Bike not found');
    error.statusCode = 404;
    throw error;
  }
  if (bike.isActive === false) {
    const error = new Error('Bike model is currently inactive');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify optional variant relationship integrity
  let variant = null;
  if (variantId) {
    variant = await BikeVariant.findById(variantId);
    if (!variant) {
      const error = new Error('Bike variant not found');
      error.statusCode = 404;
      throw error;
    }
    if (variant.bike.toString() !== bike._id.toString()) {
      const error = new Error('Variant does not belong to the selected bike model');
      error.statusCode = 400;
      throw error;
    }
    if (variant.isActive === false) {
      const error = new Error('Bike variant is currently inactive');
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Persist test ride booking strictly with status="requested" and server-assigned user
  const testRide = await TestRide.create({
    user: user._id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : (user.phone || ''),
    showroom: showroom._id,
    bike: bike._id,
    variant: variant ? variant._id : null,
    preferredDate: new Date(preferredDate),
    preferredTime: preferredTime.trim(),
    status: 'requested',
    notes: notes ? notes.trim() : ''
  });

  // 6. Return populated document without sensitive credentials
  const populated = await TestRide.findById(testRide._id)
    .populate('user', 'name email phone')
    .populate('showroom', 'name slug address contact showroomType isActive')
    .populate('bike', 'name slug category images priceRange isActive')
    .populate('variant', 'name trim exShowroomPrice isActive');

  return populated;
};

/**
 * Service: Retrieve paginated test rides for the authenticated customer only.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getUserTestRides = async ({ userId, page = 1, limit = 20 }) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: userId };
  const total = await TestRide.countDocuments(filter);

  const testRides = await TestRide.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('showroom', 'name slug address contact showroomType')
    .populate('bike', 'name slug category images priceRange')
    .populate('variant', 'name trim exShowroomPrice');

  return {
    data: testRides,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

module.exports = {
  createTestRide,
  getUserTestRides
};
