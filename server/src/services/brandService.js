const { Brand } = require('../models');
const { isConnected } = require('../config/database');

/**
 * Escapes regex special characters to prevent ReDoS and unintended regex injection.
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
  if (!isConnected() && !Brand._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Retrieve paginated brands with optional filtering.
 * @param {object} params
 * @param {number|string} [params.page=1]
 * @param {number|string} [params.limit=20]
 * @param {string} [params.search]
 * @param {string|boolean} [params.isActive]
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getBrands = async ({ page = 1, limit = 20, search, isActive } = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build filter safely without trusting arbitrary operators
  const filter = {};

  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.name = { $regex: new RegExp(sanitizedSearch, 'i') };
  }

  const [data, total] = await Promise.all([
    Brand.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean(),
    Brand.countDocuments(filter)
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
 * Retrieve a single brand by slug.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
const getBrandBySlug = async (slug) => {
  assertDatabaseConnected();

  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  return Brand.findOne({ slug: sanitizedSlug })
    .select('-__v')
    .lean();
};

module.exports = {
  getBrands,
  getBrandBySlug,
  escapeRegex
};
