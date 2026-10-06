const { City, Showroom } = require('../models');
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
  if (!isConnected() && !City._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Retrieve paginated cities with optional filtering (Public & Admin).
 * @param {object} params
 * @param {number|string} [params.page=1]
 * @param {number|string} [params.limit=20]
 * @param {string} [params.search]
 * @param {string} [params.state]
 * @param {string|boolean} [params.isActive]
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getCities = async ({ page = 1, limit = 20, search, state, isActive } = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (state && typeof state === 'string' && state.trim() !== '') {
    const sanitizedState = escapeRegex(state.trim());
    filter.state = { $regex: new RegExp(`^${sanitizedState}$`, 'i') };
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.name = { $regex: new RegExp(sanitizedSearch, 'i') };
  }

  const [data, total] = await Promise.all([
    City.find(filter)
      .sort({ state: 1, name: 1, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean(),
    City.countDocuments(filter)
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
 * Retrieve a single city by slug (Public).
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
const getCityBySlug = async (slug) => {
  assertDatabaseConnected();

  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  return City.findOne({ slug: sanitizedSlug })
    .select('-__v')
    .lean();
};

/**
 * Retrieve a single city by MongoDB ObjectId (Admin).
 * @param {string} id
 * @returns {Promise<object>}
 */
const getCityById = async (id) => {
  assertDatabaseConnected();

  const city = await City.findById(id).select('-__v').lean();
  if (!city) {
    const error = new Error('City not found');
    error.statusCode = 404;
    throw error;
  }

  return city;
};

/**
 * Create a new city (Admin).
 * @param {object} payload
 * @returns {Promise<object>} Created city
 */
const createCity = async (payload) => {
  assertDatabaseConnected();

  const { name, slug, state, country, tier, coordinates, isActive } = payload;

  const existing = await City.findOne({ slug });
  if (existing) {
    const error = new Error(`A city with the slug '${slug}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  try {
    const city = await City.create({
      name,
      slug,
      state,
      country: country || 'India',
      tier: tier || 'Metro',
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      isActive: isActive !== undefined ? isActive : true
    });

    return city;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('A city with this slug already exists.');
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

/**
 * Update an existing city (Admin).
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} Updated city
 */
const updateCity = async (id, payload) => {
  assertDatabaseConnected();

  const city = await City.findById(id);
  if (!city) {
    const error = new Error('City not found');
    error.statusCode = 404;
    throw error;
  }

  const { name, slug, state, country, tier, coordinates, isActive } = payload;

  if (slug && slug !== city.slug) {
    const existing = await City.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      const error = new Error(`A city with the slug '${slug}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (name !== undefined) city.name = name;
  if (slug !== undefined) city.slug = slug;
  if (state !== undefined) city.state = state;
  if (country !== undefined) city.country = country;
  if (tier !== undefined) city.tier = tier;
  if (coordinates !== undefined) city.coordinates = coordinates;
  if (isActive !== undefined) city.isActive = isActive;

  try {
    await city.save();
    return city;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('A city with this slug already exists.');
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

/**
 * Specifically toggle/set city active status (Admin).
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>}
 */
const updateCityStatus = async (id, isActive) => {
  assertDatabaseConnected();

  const city = await City.findById(id);
  if (!city) {
    const error = new Error('City not found');
    error.statusCode = 404;
    throw error;
  }

  city.isActive = isActive;
  await city.save();
  return city;
};

/**
 * Delete or safe-deactivate city (Admin).
 * Enforces referential integrity: if city is referenced by Showroom,
 * applies safe deactivation instead of destructive deletion to avoid orphaned records.
 * @param {string} id
 * @returns {Promise<{ deleted: boolean, deactivated: boolean, message: string, city?: object }>}
 */
const deleteCity = async (id) => {
  assertDatabaseConnected();

  const city = await City.findById(id);
  if (!city) {
    const error = new Error('City not found');
    error.statusCode = 404;
    throw error;
  }

  const showroomCount = await Showroom.countDocuments({ city: id });

  if (showroomCount > 0) {
    city.isActive = false;
    await city.save();

    return {
      deleted: false,
      deactivated: true,
      message: `City is referenced by ${showroomCount} authorized showroom(s). Safe deactivation applied to prevent orphaned catalogue records.`,
      city
    };
  }

  await City.findByIdAndDelete(id);

  return {
    deleted: true,
    deactivated: false,
    message: 'City deleted successfully'
  };
};

module.exports = {
  getCities,
  getCityBySlug,
  getCityById,
  createCity,
  updateCity,
  updateCityStatus,
  deleteCity,
  escapeRegex
};
