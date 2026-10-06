const { Favorite, Bike, Showroom, User } = require('../models');
const { isConnected } = require('../config/database');
const { FAVORITE_TYPES } = require('../constants/favorites');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Favorite._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Service: Toggle a bike or showroom favorite for the authenticated user.
 * Adds the favorite if it does not exist; removes it if it does.
 * @param {object} params
 * @param {string} params.userId - Derived from JWT, never client-supplied
 * @param {string} params.entityType - 'bike' | 'showroom'
 * @param {string} params.entityId  - MongoDB ObjectId of the entity
 * @returns {Promise<{ favorited: boolean, favorite: object|null }>}
 */
const toggleFavorite = async ({ userId, entityType, entityId }) => {
  assertDatabaseConnected();

  // 1. Verify authenticated user is active
  const user = await User.findById(userId);
  if (!user || user.isActive === false) {
    const error = new Error('Authenticated user account is inactive or not found');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify the referenced entity exists and is active
  if (entityType === FAVORITE_TYPES.BIKE) {
    const bike = await Bike.findById(entityId);
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

    // 3. Toggle: remove if exists, add if not
    const existing = await Favorite.findOne({
      user: userId,
      entityType: FAVORITE_TYPES.BIKE,
      bike: entityId
    });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return { favorited: false, favorite: null };
    }

    const favorite = await Favorite.create({
      user: userId,
      entityType: FAVORITE_TYPES.BIKE,
      bike: entityId,
      showroom: null
    });

    const populated = await Favorite.findById(favorite._id)
      .populate('bike', 'name slug category images priceRange brand isActive');
    return { favorited: true, favorite: populated };

  } else if (entityType === FAVORITE_TYPES.SHOWROOM) {
    const showroom = await Showroom.findById(entityId);
    if (!showroom) {
      const error = new Error('Showroom not found');
      error.statusCode = 404;
      throw error;
    }
    if (showroom.isActive === false) {
      const error = new Error('Showroom is currently inactive');
      error.statusCode = 400;
      throw error;
    }

    // 3. Toggle: remove if exists, add if not
    const existing = await Favorite.findOne({
      user: userId,
      entityType: FAVORITE_TYPES.SHOWROOM,
      showroom: entityId
    });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return { favorited: false, favorite: null };
    }

    const favorite = await Favorite.create({
      user: userId,
      entityType: FAVORITE_TYPES.SHOWROOM,
      showroom: entityId,
      bike: null
    });

    const populated = await Favorite.findById(favorite._id)
      .populate('showroom', 'name slug address contact showroomType city isActive');
    return { favorited: true, favorite: populated };
  }

  const error = new Error('Invalid entity type');
  error.statusCode = 400;
  throw error;
};

/**
 * Service: Check if a given entity is favorited by the authenticated user.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.entityType - 'bike' | 'showroom'
 * @param {string} params.entityId
 * @returns {Promise<{ favorited: boolean }>}
 */
const checkFavorite = async ({ userId, entityType, entityId }) => {
  assertDatabaseConnected();

  const query = { user: userId, entityType };

  if (entityType === FAVORITE_TYPES.BIKE) {
    query.bike = entityId;
  } else if (entityType === FAVORITE_TYPES.SHOWROOM) {
    query.showroom = entityId;
  } else {
    const error = new Error('Invalid entity type');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Favorite.findOne(query).lean();
  return { favorited: Boolean(existing) };
};

/**
 * Service: Retrieve paginated favorites for the authenticated customer.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.entityType] - Optional filter: 'bike' | 'showroom'
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getUserFavorites = async ({ userId, entityType, page = 1, limit = 20 }) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: userId };
  if (entityType && Object.values(FAVORITE_TYPES).includes(entityType)) {
    filter.entityType = entityType;
  }

  const [favorites, total] = await Promise.all([
    Favorite.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('bike', 'name slug category images priceRange brand isActive')
      .populate('showroom', 'name slug address contact showroomType city isActive')
      .select('-__v')
      .lean(),
    Favorite.countDocuments(filter)
  ]);

  return {
    data: favorites,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

module.exports = {
  toggleFavorite,
  checkFavorite,
  getUserFavorites
};
