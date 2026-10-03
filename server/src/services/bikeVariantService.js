const { Bike, BikeVariant, Brand, Lead, TestRide, Offer } = require('../models');
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
 * Retrieve paginated variants for a specific bike model slug (Public catalogue).
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

/**
 * Retrieve paginated variants for admin console scoped to a specific parent bike ObjectId.
 * @param {string} bikeId
 * @param {object} params
 * @returns {Promise<{ bike: object, data: Array, meta: object }>}
 */
const getAdminBikeVariants = async (
  bikeId,
  { page = 1, limit = 50, search, minPrice, maxPrice, isActive, sort } = {}
) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId)
    .select('_id name slug brand category priceRange')
    .populate('brand', '_id name slug logo originCountry')
    .lean();

  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const filter = { bike: bikeId };

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
    filter.isActive = String(isActive) === 'true';
  }

  if (minPrice !== undefined && minPrice !== '') {
    filter.exShowroomPrice = { ...filter.exShowroomPrice, $gte: Number(minPrice) };
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    filter.exShowroomPrice = { ...filter.exShowroomPrice, $lte: Number(maxPrice) };
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitizedSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(sanitizedSearch, 'i') } },
      { slug: { $regex: new RegExp(sanitizedSearch, 'i') } }
    ];
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

/**
 * Retrieve single variant by variantId scoped to parent bikeId.
 * @param {string} bikeId
 * @param {string} variantId
 * @returns {Promise<object>}
 */
const getBikeVariantById = async (bikeId, variantId) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId);
  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const variant = await BikeVariant.findById(variantId)
    .populate('brand', '_id name slug logo')
    .select('-__v')
    .lean();

  if (!variant) {
    const err = new Error('Bike variant not found');
    err.statusCode = 404;
    throw err;
  }

  if (variant.bike.toString() !== bikeId.toString()) {
    const err = new Error('Bike variant does not belong to the specified bike model.');
    err.statusCode = 400;
    throw err;
  }

  return variant;
};

/**
 * Create a new variant for a bike model.
 * @param {string} bikeId
 * @param {object} data
 * @returns {Promise<object>}
 */
const createBikeVariant = async (bikeId, data) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId);
  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const normalizedSlug = data.slug.toLowerCase().trim();

  // Validate unique variant slug scoped to this bike
  const existingSlug = await BikeVariant.findOne({
    bike: bikeId,
    slug: normalizedSlug
  });

  if (existingSlug) {
    const err = new Error(`A variant with slug '${data.slug}' already exists for this bike.`);
    err.statusCode = 400;
    throw err;
  }

  const variant = await BikeVariant.create({
    bike: bikeId,
    brand: data.brand || parentBike.brand,
    name: data.name.trim(),
    slug: normalizedSlug,
    exShowroomPrice: Number(data.exShowroomPrice),
    colors: Array.isArray(data.colors) ? data.colors : [],
    keySpecifications: data.keySpecifications || {},
    keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : [],
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  return BikeVariant.findById(variant._id)
    .populate('brand', '_id name slug logo')
    .select('-__v')
    .lean();
};

/**
 * Update an existing bike variant.
 * @param {string} bikeId
 * @param {string} variantId
 * @param {object} data
 * @returns {Promise<object>}
 */
const updateBikeVariant = async (bikeId, variantId, data) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId);
  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const variant = await BikeVariant.findById(variantId);
  if (!variant) {
    const err = new Error('Bike variant not found');
    err.statusCode = 404;
    throw err;
  }

  if (variant.bike.toString() !== bikeId.toString()) {
    const err = new Error('Bike variant does not belong to the specified bike model.');
    err.statusCode = 400;
    throw err;
  }

  if (data.slug) {
    const normalizedSlug = data.slug.toLowerCase().trim();
    const existingSlug = await BikeVariant.findOne({
      bike: bikeId,
      slug: normalizedSlug,
      _id: { $ne: variantId }
    });

    if (existingSlug) {
      const err = new Error(`A variant with slug '${data.slug}' already exists for this bike.`);
      err.statusCode = 400;
      throw err;
    }
    variant.slug = normalizedSlug;
  }

  if (data.name !== undefined) variant.name = data.name.trim();
  if (data.exShowroomPrice !== undefined) variant.exShowroomPrice = Number(data.exShowroomPrice);
  if (data.colors !== undefined) variant.colors = data.colors;
  if (data.keySpecifications !== undefined) {
    variant.keySpecifications = {
      ...(variant.keySpecifications ? variant.keySpecifications.toObject() : {}),
      ...data.keySpecifications
    };
  }
  if (data.keyFeatures !== undefined) variant.keyFeatures = data.keyFeatures;
  if (data.isActive !== undefined) variant.isActive = data.isActive;

  await variant.save();

  return BikeVariant.findById(variantId)
    .populate('brand', '_id name slug logo')
    .select('-__v')
    .lean();
};

/**
 * Update bike variant active status.
 * @param {string} bikeId
 * @param {string} variantId
 * @param {boolean} isActive
 * @returns {Promise<object>}
 */
const updateBikeVariantStatus = async (bikeId, variantId, isActive) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId);
  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const variant = await BikeVariant.findById(variantId);
  if (!variant) {
    const err = new Error('Bike variant not found');
    err.statusCode = 404;
    throw err;
  }

  if (variant.bike.toString() !== bikeId.toString()) {
    const err = new Error('Bike variant does not belong to the specified bike model.');
    err.statusCode = 400;
    throw err;
  }

  variant.isActive = Boolean(isActive);
  await variant.save();

  return BikeVariant.findById(variantId)
    .populate('brand', '_id name slug logo')
    .select('-__v')
    .lean();
};

/**
 * Delete or safely deactivate a bike variant if referenced by leads, test rides, or offers.
 * @param {string} bikeId
 * @param {string} variantId
 * @returns {Promise<{ deleted: boolean, deactivated: boolean, message: string, references?: object }>}
 */
const deleteBikeVariant = async (bikeId, variantId) => {
  assertDatabaseConnected();

  const parentBike = await Bike.findById(bikeId);
  if (!parentBike) {
    const err = new Error('Parent bike not found');
    err.statusCode = 404;
    throw err;
  }

  const variant = await BikeVariant.findById(variantId);
  if (!variant) {
    const err = new Error('Bike variant not found');
    err.statusCode = 404;
    throw err;
  }

  if (variant.bike.toString() !== bikeId.toString()) {
    const err = new Error('Bike variant does not belong to the specified bike model.');
    err.statusCode = 400;
    throw err;
  }

  // Check inbound references from Lead, TestRide, Offer
  const [leadsCount, testRidesCount, offersCount] = await Promise.all([
    Lead ? Lead.countDocuments({ variant: variantId }) : 0,
    TestRide ? TestRide.countDocuments({ variant: variantId }) : 0,
    Offer ? Offer.countDocuments({ variant: variantId }) : 0
  ]);

  const totalReferences = leadsCount + testRidesCount + offersCount;

  if (totalReferences > 0) {
    variant.isActive = false;
    await variant.save();
    return {
      deleted: false,
      deactivated: true,
      message:
        'Variant is referenced by customer leads, test rides, or offers. Safely deactivated instead of deleted.',
      references: {
        leads: leadsCount,
        testRides: testRidesCount,
        offers: offersCount
      }
    };
  }

  await BikeVariant.findByIdAndDelete(variantId);
  return {
    deleted: true,
    deactivated: false,
    message: 'Bike variant permanently removed.'
  };
};

module.exports = {
  getBikeVariants,
  getAdminBikeVariants,
  getBikeVariantById,
  createBikeVariant,
  updateBikeVariant,
  updateBikeVariantStatus,
  deleteBikeVariant,
  escapeRegex,
  VARIANT_SORT_MAP
};
