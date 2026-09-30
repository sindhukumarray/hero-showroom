const { Showroom, Brand, City, Lead, TestRide, Review, Offer, Favorite } = require('../models');
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

/**
 * Retrieve paginated showrooms for admin management with filtering and population.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getAdminShowrooms = async ({
  page = 1,
  limit = 20,
  search,
  brand,
  city,
  showroomType,
  isActive,
  isVerified,
  sort = 'newest'
} = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
    filter.isActive = String(isActive) === 'true';
  }

  if (isVerified !== undefined && isVerified !== '' && isVerified !== 'all') {
    filter.isVerified = String(isVerified) === 'true';
  }

  if (brand && brand !== 'all') {
    filter.brand = brand;
  }

  if (city && city !== 'all') {
    filter.city = city;
  }

  if (showroomType && showroomType !== 'all') {
    filter.showroomType = showroomType;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { slug: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { dealerName: { $regex: new RegExp(sanitizedSearch, 'i') } },
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
      .populate('brand', '_id name slug logo originCountry')
      .populate('city', '_id name slug state tier')
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
 * Retrieve a single showroom by ID with populated relationships.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getShowroomById = async (id) => {
  assertDatabaseConnected();

  if (!id) return null;

  return Showroom.findById(id)
    .populate('brand', '_id name slug logo originCountry website description')
    .populate('city', '_id name slug state tier coordinates')
    .select('-__v')
    .lean();
};

/**
 * Create a new showroom in the catalogue with referential integrity checks.
 * @param {object} data
 * @returns {Promise<object>}
 */
const createShowroom = async (data) => {
  assertDatabaseConnected();

  // Validate Brand exists
  const brandDoc = await Brand.findById(data.brand);
  if (!brandDoc) {
    const err = new Error('Referenced brand does not exist.');
    err.statusCode = 400;
    throw err;
  }

  // Validate City exists
  const cityDoc = await City.findById(data.city);
  if (!cityDoc) {
    const err = new Error('Referenced city does not exist.');
    err.statusCode = 400;
    throw err;
  }

  // Check unique slug collision
  const existingSlug = await Showroom.findOne({ slug: data.slug.toLowerCase().trim() });
  if (existingSlug) {
    const err = new Error(`A showroom with the slug '${data.slug}' already exists.`);
    err.statusCode = 400;
    throw err;
  }

  const newShowroom = await Showroom.create({
    name: data.name.trim(),
    slug: data.slug.toLowerCase().trim(),
    brand: data.brand,
    city: data.city,
    dealerName: data.dealerName ? data.dealerName.trim() : '',
    showroomType: data.showroomType || 'Standard Dealership',
    address: data.address,
    contact: data.contact,
    location: data.location || { type: 'Point', coordinates: [0, 0] },
    openingHours: data.openingHours || { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Sunday' },
    facilities: data.facilities || ['Test Rides Available', 'Authorized Service'],
    images: data.images || { exterior: '', interior: [] },
    isVerified: data.isVerified !== undefined ? data.isVerified : false,
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  return Showroom.findById(newShowroom._id)
    .populate('brand', '_id name slug logo originCountry')
    .populate('city', '_id name slug state tier')
    .select('-__v')
    .lean();
};

/**
 * Update an existing showroom with validation and unique integrity.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const updateShowroom = async (id, data) => {
  assertDatabaseConnected();

  const showroom = await Showroom.findById(id);
  if (!showroom) {
    const err = new Error('Showroom not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.brand) {
    const brandDoc = await Brand.findById(data.brand);
    if (!brandDoc) {
      const err = new Error('Referenced brand does not exist.');
      err.statusCode = 400;
      throw err;
    }
    showroom.brand = data.brand;
  }

  if (data.city) {
    const cityDoc = await City.findById(data.city);
    if (!cityDoc) {
      const err = new Error('Referenced city does not exist.');
      err.statusCode = 400;
      throw err;
    }
    showroom.city = data.city;
  }

  if (data.slug) {
    const normalizedSlug = data.slug.toLowerCase().trim();
    const existingSlug = await Showroom.findOne({ slug: normalizedSlug, _id: { $ne: id } });
    if (existingSlug) {
      const err = new Error(`A showroom with the slug '${data.slug}' already exists.`);
      err.statusCode = 400;
      throw err;
    }
    showroom.slug = normalizedSlug;
  }

  if (data.name !== undefined) showroom.name = data.name.trim();
  if (data.dealerName !== undefined) showroom.dealerName = data.dealerName.trim();
  if (data.showroomType !== undefined) showroom.showroomType = data.showroomType;
  if (data.address) showroom.address = { ...(showroom.address ? showroom.address.toObject() : {}), ...data.address };
  if (data.contact) showroom.contact = { ...(showroom.contact ? showroom.contact.toObject() : {}), ...data.contact };
  if (data.location) showroom.location = data.location;
  if (data.openingHours) showroom.openingHours = { ...(showroom.openingHours ? showroom.openingHours.toObject() : {}), ...data.openingHours };
  if (data.facilities) showroom.facilities = data.facilities;
  if (data.images) showroom.images = { ...(showroom.images ? showroom.images.toObject() : {}), ...data.images };
  if (data.isVerified !== undefined) showroom.isVerified = data.isVerified;
  if (data.isActive !== undefined) showroom.isActive = data.isActive;

  await showroom.save();

  return Showroom.findById(id)
    .populate('brand', '_id name slug logo originCountry')
    .populate('city', '_id name slug state tier')
    .select('-__v')
    .lean();
};

/**
 * Update only the active status of a showroom.
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>}
 */
const updateShowroomStatus = async (id, isActive) => {
  assertDatabaseConnected();

  const showroom = await Showroom.findById(id);
  if (!showroom) {
    const err = new Error('Showroom not found');
    err.statusCode = 404;
    throw err;
  }

  showroom.isActive = Boolean(isActive);
  await showroom.save();

  return Showroom.findById(id)
    .populate('brand', '_id name slug logo originCountry')
    .populate('city', '_id name slug state tier')
    .select('-__v')
    .lean();
};

/**
 * Delete or safely deactivate a showroom if it has dependent catalogue references.
 * @param {string} id
 * @returns {Promise<{ deleted: boolean, deactivated: boolean, message: string, references?: object }>}
 */
const deleteShowroom = async (id) => {
  assertDatabaseConnected();

  const showroom = await Showroom.findById(id);
  if (!showroom) {
    const err = new Error('Showroom not found');
    err.statusCode = 404;
    throw err;
  }

  // Count references across dependent models
  const [leadsCount, testRidesCount, reviewsCount, offersCount, favoritesCount] = await Promise.all([
    Lead ? Lead.countDocuments({ showroom: id }) : 0,
    TestRide ? TestRide.countDocuments({ showroom: id }) : 0,
    Review ? Review.countDocuments({ showroom: id }) : 0,
    Offer ? Offer.countDocuments({ showroom: id }) : 0,
    Favorite ? Favorite.countDocuments({ showroom: id }) : 0
  ]);

  const totalReferences = leadsCount + testRidesCount + reviewsCount + offersCount + favoritesCount;

  if (totalReferences > 0) {
    showroom.isActive = false;
    await showroom.save();
    return {
      deleted: false,
      deactivated: true,
      message:
        'Showroom is referenced by existing customer records (leads, test rides, offers, or reviews). Safely deactivated instead of deleted.',
      references: {
        leads: leadsCount,
        testRides: testRidesCount,
        reviews: reviewsCount,
        offers: offersCount,
        favorites: favoritesCount
      }
    };
  }

  await Showroom.findByIdAndDelete(id);
  return {
    deleted: true,
    deactivated: false,
    message: 'Showroom permanently removed.'
  };
};

module.exports = {
  getShowrooms,
  getShowroomBySlug,
  getNearbyShowrooms,
  getAdminShowrooms,
  getShowroomById,
  createShowroom,
  updateShowroom,
  updateShowroomStatus,
  deleteShowroom,
  escapeRegex,
  SORT_MAP
};

