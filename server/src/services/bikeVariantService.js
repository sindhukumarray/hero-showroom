const { Bike, BikeVariant } = require('../models');
const { isConnected } = require('../config/database');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !BikeVariant._mockActive && !Bike._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Supported stable sorting definitions for Bike Variants
 */
const VARIANT_SORT_MAP = {
  priceLow: { exShowroomPrice: 1, _id: 1 },
  priceHigh: { exShowroomPrice: -1, _id: 1 },
  nameAsc: { name: 1, _id: 1 },
  nameDesc: { name: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 }
};

/**
 * Retrieve paginated variants for a specific bike model slug.
 * @param {string} slug Parent bike slug
 * @param {object} params
 * @returns {Promise<{ bike: object, data: Array, meta: object }|null>}
 */
const getBikeVariants = async (slug, { page = 1, limit = 20, minPrice, maxPrice, isActive, sort } = {}) => {
  assertDatabaseConnected();

  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  // 1. Resolve parent Bike model
  const parentBike = await Bike.findOne({ slug: sanitizedSlug })
    .select('_id name slug brand category priceRange')
    .populate('brand', '_id name slug logo')
    .lean();

  if (!parentBike) {
    return null;
  }

  // 2. Query variants associated with this parent bike
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    bike: parentBike._id
  };

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (minPrice !== undefined && minPrice !== '') {
    filter.exShowroomPrice = { ...filter.exShowroomPrice, $gte: Number(minPrice) };
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    filter.exShowroomPrice = { ...filter.exShowroomPrice, $lte: Number(maxPrice) };
  }

  const sortCriteria = VARIANT_SORT_MAP[sort] || VARIANT_SORT_MAP.priceLow;

  const [data, total] = await Promise.all([
    BikeVariant.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('brand', '_id name slug logo')
      .select('-__v')
      .lean(),
    BikeVariant.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limitNum);

  return {
    bike: parentBike,
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages
    }
  };
};

module.exports = {
  getBikeVariants,
  VARIANT_SORT_MAP
};
