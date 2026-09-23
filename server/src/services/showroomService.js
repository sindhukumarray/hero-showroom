const { Showroom } = require('../models');
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
  if (!isConnected() && !Showroom._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Supported stable sorting definitions
 */
const SORT_MAP = {
  nameAsc: { name: 1, _id: 1 },
  nameDesc: { name: -1, _id: 1 },
  ratingDesc: { 'rating.average': -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 }
};

/**
 * Retrieve paginated showrooms with filtering and population.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getShowrooms = async ({
  page = 1,
  limit = 20,
  search,
  brand,
  city,
  showroomType,
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

  if (city) {
    filter.city = city;
  }

  if (showroomType) {
    filter.showroomType = showroomType;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { 'address.fullAddress': { $regex: new RegExp(sanitizedSearch, 'i') } },
      { 'address.area': { $regex: new RegExp(sanitizedSearch, 'i') } }
    ];
  }

  const sortCriteria = SORT_MAP[sort] || SORT_MAP.newest;

  const [data, total] = await Promise.all([
    Showroom.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('brand', '_id name slug logo')
      .populate('city', '_id name slug state')
      .select('-__v')
      .lean(),
    Showroom.countDocuments(filter)
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
 * Retrieve a single showroom by slug with enriched relationship data.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
const getShowroomBySlug = async (slug) => {
  assertDatabaseConnected();

  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  return Showroom.findOne({ slug: sanitizedSlug })
    .populate('brand', '_id name slug logo website originCountry description')
    .populate('city', '_id name slug state tier coordinates')
    .select('-__v')
    .lean();
};

/**
 * Retrieve nearby showrooms ordered by geospatial distance.
 * @param {object} params
 * @param {number|string} params.lat
 * @param {number|string} params.lng
 * @param {number|string} [params.maxDistance=50000]
 * @param {number|string} [params.limit=20]
 * @param {string} [params.brand]
 * @param {string} [params.showroomType]
 * @param {string|boolean} [params.isActive]
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getNearbyShowrooms = async ({
  lat,
  lng,
  maxDistance = 50000,
  limit = 20,
  brand,
  showroomType,
  isActive
} = {}) => {
  assertDatabaseConnected();

  const latitude = Number(lat);
  const longitude = Number(lng);
  const maxDist = Math.max(1, Number(maxDistance) || 50000);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // [lng, lat]
        },
        $maxDistance: maxDist
      }
    }
  };

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (brand) {
    filter.brand = brand;
  }

  if (showroomType) {
    filter.showroomType = showroomType;
  }

  const data = await Showroom.find(filter)
    .limit(limitNum)
    .populate('brand', '_id name slug logo')
    .populate('city', '_id name slug state')
    .select('-__v')
    .lean();

  return {
    data,
    meta: {
      total: data.length,
      limit: limitNum,
      coordinates: [longitude, latitude],
      maxDistance: maxDist
    }
  };
};

module.exports = {
  getShowrooms,
  getShowroomBySlug,
  getNearbyShowrooms,
  escapeRegex,
  SORT_MAP
};
