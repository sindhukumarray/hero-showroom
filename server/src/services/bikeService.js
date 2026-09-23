const { Bike } = require('../models');
const { isConnected } = require('../config/database');

/**
 * Escapes regex special characters to prevent ReDoS and injection.
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Bike._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Supported stable sorting definitions for Bike catalogue
 */
const SORT_MAP = {
  nameAsc: { name: 1, _id: 1 },
  nameDesc: { name: -1, _id: 1 },
  priceLow: { 'priceRange.minPrice': 1, _id: 1 },
  priceHigh: { 'priceRange.maxPrice': -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 }
};

/**
 * Retrieve paginated bikes with filtering and population.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getBikes = async ({
  page = 1,
  limit = 20,
  search,
  brand,
  category,
  fuelType,
  transmission,
  minPrice,
  maxPrice,
  isActive,
  sort
} = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build filter safely
  const filter = {};

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (brand) {
    filter.brand = brand;
  }

  if (category) {
    filter.category = category;
  }

  if (fuelType) {
    filter.fuelType = fuelType;
  }

  if (transmission && typeof transmission === 'string' && transmission.trim() !== '') {
    const sanitizedTrans = escapeRegex(transmission.trim());
    filter.transmission = { $regex: new RegExp(`^${sanitizedTrans}$`, 'i') };
  }

  // Price range filtering on Bike model
  if (minPrice !== undefined && minPrice !== '') {
    filter['priceRange.minPrice'] = { ...filter['priceRange.minPrice'], $gte: Number(minPrice) };
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    filter['priceRange.maxPrice'] = { ...filter['priceRange.maxPrice'], $lte: Number(maxPrice) };
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { tagline: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { description: { $regex: new RegExp(sanitizedSearch, 'i') } }
    ];
  }

  const sortCriteria = SORT_MAP[sort] || SORT_MAP.newest;

  const [data, total] = await Promise.all([
    Bike.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('brand', '_id name slug logo')
      .select('-__v')
      .lean(),
    Bike.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limitNum);

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages
    }
  };
};

/**
 * Retrieve a single bike model by unique slug with enriched brand information.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
const getBikeBySlug = async (slug) => {
  assertDatabaseConnected();

  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  return Bike.findOne({ slug: sanitizedSlug })
    .populate('brand', '_id name slug logo website originCountry description')
    .select('-__v')
    .lean();
};

module.exports = {
  getBikes,
  getBikeBySlug,
  escapeRegex,
  SORT_MAP
};
