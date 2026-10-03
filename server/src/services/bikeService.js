const { Bike, BikeVariant, Brand, Lead, TestRide, Offer, Favorite } = require('../models');
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

/**
 * Retrieve paginated bikes for admin console with administrative filters and population.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getAdminBikes = async ({
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
  isFeatured,
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

  if (isFeatured !== undefined && isFeatured !== '' && isFeatured !== 'all') {
    filter.isFeatured = String(isFeatured) === 'true';
  }

  if (brand && brand !== 'all') {
    filter.brand = brand;
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (fuelType && fuelType !== 'all') {
    filter.fuelType = fuelType;
  }

  if (transmission && transmission !== 'all') {
    const sanitizedTrans = escapeRegex(transmission.trim());
    filter.transmission = { $regex: new RegExp(`^${sanitizedTrans}$`, 'i') };
  }

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
      { slug: { $regex: new RegExp(sanitizedSearch, 'i') } },
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
      .populate('brand', '_id name slug logo originCountry')
      .select('-__v')
      .lean(),
    Bike.countDocuments(filter)
  ]);

  if (data.length > 0 && BikeVariant) {
    const bikeIds = data.map((b) => b._id);
    const variantCounts = await BikeVariant.aggregate([
      { $match: { bike: { $in: bikeIds } } },
      { $group: { _id: '$bike', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    variantCounts.forEach((vc) => {
      countMap[vc._id.toString()] = vc.count;
    });
    data.forEach((b) => {
      b.variantCount = countMap[b._id.toString()] || 0;
    });
  }

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
 * Retrieve a single bike by ID with populated brand details.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getBikeById = async (id) => {
  assertDatabaseConnected();

  if (!id) return null;

  const bike = await Bike.findById(id)
    .populate('brand', '_id name slug logo website originCountry description')
    .select('-__v')
    .lean();

  if (!bike) return null;

  if (BikeVariant) {
    bike.variantCount = await BikeVariant.countDocuments({ bike: id });
  } else {
    bike.variantCount = 0;
  }

  return bike;
};

/**
 * Create a new bike model in the catalogue.
 * @param {object} data
 * @returns {Promise<object>}
 */
const createBike = async (data) => {
  assertDatabaseConnected();

  // Validate Brand exists
  const brandDoc = await Brand.findById(data.brand);
  if (!brandDoc) {
    const err = new Error('Referenced brand does not exist.');
    err.statusCode = 400;
    throw err;
  }

  // Check unique slug collision
  const existingSlug = await Bike.findOne({ slug: data.slug.toLowerCase().trim() });
  if (existingSlug) {
    const err = new Error(`A bike model with the slug '${data.slug}' already exists.`);
    err.statusCode = 400;
    throw err;
  }

  const newBike = await Bike.create({
    name: data.name.trim(),
    slug: data.slug.toLowerCase().trim(),
    brand: data.brand,
    category: data.category,
    tagline: data.tagline ? data.tagline.trim() : '',
    description: data.description ? data.description.trim() : '',
    images: data.images || { heroImage: '', gallery: [] },
    engine: data.engine || {
      displacementCc: 0,
      maxPower: '',
      maxTorque: '',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    fuelType: data.fuelType || 'Petrol',
    transmission: data.transmission || 'Manual',
    brakes: data.brakes || { front: 'Disc', rear: 'Drum', absType: 'Single Channel ABS' },
    mileage: data.mileage || { estimatedKmpl: 0, certifiedRangeKm: 0 },
    priceRange: data.priceRange,
    isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  return Bike.findById(newBike._id)
    .populate('brand', '_id name slug logo originCountry')
    .select('-__v')
    .lean();
};

/**
 * Update an existing bike model with collision checking.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const updateBike = async (id, data) => {
  assertDatabaseConnected();

  const bike = await Bike.findById(id);
  if (!bike) {
    const err = new Error('Bike not found');
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
    bike.brand = data.brand;
  }

  if (data.slug) {
    const normalizedSlug = data.slug.toLowerCase().trim();
    const existingSlug = await Bike.findOne({ slug: normalizedSlug, _id: { $ne: id } });
    if (existingSlug) {
      const err = new Error(`A bike model with the slug '${data.slug}' already exists.`);
      err.statusCode = 400;
      throw err;
    }
    bike.slug = normalizedSlug;
  }

  if (data.name !== undefined) bike.name = data.name.trim();
  if (data.category !== undefined) bike.category = data.category;
  if (data.tagline !== undefined) bike.tagline = data.tagline.trim();
  if (data.description !== undefined) bike.description = data.description.trim();
  if (data.images) bike.images = { ...(bike.images ? bike.images.toObject() : {}), ...data.images };
  if (data.engine) bike.engine = { ...(bike.engine ? bike.engine.toObject() : {}), ...data.engine };
  if (data.fuelType !== undefined) bike.fuelType = data.fuelType;
  if (data.transmission !== undefined) bike.transmission = data.transmission;
  if (data.brakes) bike.brakes = { ...(bike.brakes ? bike.brakes.toObject() : {}), ...data.brakes };
  if (data.mileage) bike.mileage = { ...(bike.mileage ? bike.mileage.toObject() : {}), ...data.mileage };
  if (data.priceRange) bike.priceRange = { ...(bike.priceRange ? bike.priceRange.toObject() : {}), ...data.priceRange };
  if (data.isFeatured !== undefined) bike.isFeatured = data.isFeatured;
  if (data.isActive !== undefined) bike.isActive = data.isActive;

  await bike.save();

  return Bike.findById(id)
    .populate('brand', '_id name slug logo originCountry')
    .select('-__v')
    .lean();
};

/**
 * Update only active status of a bike.
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>}
 */
const updateBikeStatus = async (id, isActive) => {
  assertDatabaseConnected();

  const bike = await Bike.findById(id);
  if (!bike) {
    const err = new Error('Bike not found');
    err.statusCode = 404;
    throw err;
  }

  bike.isActive = Boolean(isActive);
  await bike.save();

  return Bike.findById(id)
    .populate('brand', '_id name slug logo originCountry')
    .select('-__v')
    .lean();
};

/**
 * Delete or safely deactivate a bike model if referenced by variants or customer records.
 * @param {string} id
 * @returns {Promise<{ deleted: boolean, deactivated: boolean, message: string, references?: object }>}
 */
const deleteBike = async (id) => {
  assertDatabaseConnected();

  const bike = await Bike.findById(id);
  if (!bike) {
    const err = new Error('Bike not found');
    err.statusCode = 404;
    throw err;
  }

  // Count references across dependent models
  const [variantsCount, leadsCount, testRidesCount, offersCount, favoritesCount] = await Promise.all([
    BikeVariant ? BikeVariant.countDocuments({ bike: id }) : 0,
    Lead ? Lead.countDocuments({ bike: id }) : 0,
    TestRide ? TestRide.countDocuments({ bike: id }) : 0,
    Offer ? Offer.countDocuments({ bike: id }) : 0,
    Favorite ? Favorite.countDocuments({ bike: id }) : 0
  ]);

  const totalReferences = variantsCount + leadsCount + testRidesCount + offersCount + favoritesCount;

  if (totalReferences > 0) {
    bike.isActive = false;
    await bike.save();
    return {
      deleted: false,
      deactivated: true,
      message:
        'Bike is referenced by catalogue variants, leads, test rides, offers, or favorites. Safely deactivated instead of deleted.',
      references: {
        variants: variantsCount,
        leads: leadsCount,
        testRides: testRidesCount,
        offers: offersCount,
        favorites: favoritesCount
      }
    };
  }

  await Bike.findByIdAndDelete(id);
  return {
    deleted: true,
    deactivated: false,
    message: 'Bike permanently removed.'
  };
};

module.exports = {
  getBikes,
  getBikeBySlug,
  getAdminBikes,
  getBikeById,
  createBike,
  updateBike,
  updateBikeStatus,
  deleteBike,
  escapeRegex,
  SORT_MAP
};

