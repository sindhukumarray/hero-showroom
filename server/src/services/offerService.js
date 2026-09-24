const { Offer, Bike, BikeVariant, Showroom } = require('../models');
const { isConnected } = require('../config/database');
const { isValidObjectId } = require('../validators/offerValidator');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Offer._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Utility: Generate slug from title
 * @param {string} title
 * @returns {string}
 */
const generateSlug = (title) => {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Service: List public offers with filters, pagination, and date validity checks.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getOffers = async ({
  bike,
  showroom,
  offerType,
  active = 'true',
  page = 1,
  limit = 20,
  sort = '-createdAt'
} = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Active / Expiration filtering
  const now = new Date();
  if (active === 'true' || active === true) {
    filter.isActive = true;
    filter.validFrom = { $lte: now };
    filter.validUntil = { $gte: now };
  } else if (active === 'false' || active === false) {
    filter.$or = [
      { isActive: false },
      { validUntil: { $lt: now } }
    ];
  } // if active === 'all', no active/validity constraint is enforced

  if (bike && isValidObjectId(bike)) {
    filter.bike = bike;
  }

  if (showroom && isValidObjectId(showroom)) {
    filter.showroom = showroom;
  }

  if (offerType) {
    filter.offerType = offerType;
  }

  // Sort mapping
  let sortOption = { createdAt: -1 };
  if (sort === 'validUntil' || sort === 'expiringSoon') {
    sortOption = { validUntil: 1 };
  } else if (sort === 'discountHigh') {
    sortOption = { discountValue: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  }

  const total = await Offer.countDocuments(filter);

  const offers = await Offer.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: 'bike',
      select: 'name slug category images priceRange brand isActive',
      populate: { path: 'brand', select: 'name slug logo' }
    })
    .populate('variant', 'name trim exShowroomPrice isActive')
    .populate({
      path: 'showroom',
      select: 'name slug address city contact showroomType isActive',
      populate: { path: 'city', select: 'name state' }
    });

  return {
    data: offers,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Service: Retrieve single offer by its MongoDB ObjectId or unique slug.
 * @param {string} idOrSlug
 * @returns {Promise<object>}
 */
const getOfferByIdOrSlug = async (idOrSlug) => {
  assertDatabaseConnected();

  if (!idOrSlug || typeof idOrSlug !== 'string') {
    const error = new Error('Offer identifier is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmed = idOrSlug.trim();
  let offer = null;

  if (isValidObjectId(trimmed)) {
    offer = await Offer.findById(trimmed);
  }

  if (!offer) {
    offer = await Offer.findOne({ slug: trimmed.toLowerCase() });
  }

  if (!offer) {
    const error = new Error('Offer not found');
    error.statusCode = 404;
    throw error;
  }

  await offer.populate([
    {
      path: 'bike',
      select: 'name slug category images priceRange brand engine specifications isActive',
      populate: { path: 'brand', select: 'name slug logo' }
    },
    {
      path: 'variant',
      select: 'name trim exShowroomPrice specifications isActive'
    },
    {
      path: 'showroom',
      select: 'name slug address city contact showroomType isActive',
      populate: { path: 'city', select: 'name state' }
    }
  ]);

  return offer;
};

/**
 * Service: Create an offer (used for seeding and programmatic management).
 * @param {object} offerData
 * @returns {Promise<object>}
 */
const createOffer = async (offerData) => {
  assertDatabaseConnected();

  const {
    title,
    slug,
    description,
    bike: bikeId,
    variant: variantId,
    showroom: showroomId,
    offerType,
    discountValue = 0,
    benefits = [],
    terms = '',
    validFrom = new Date(),
    validUntil,
    isActive = true
  } = offerData;

  // 1. Verify Bike reference
  const bike = await Bike.findById(bikeId);
  if (!bike) {
    const error = new Error('Referenced bike not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify Variant if provided
  let variant = null;
  if (variantId) {
    variant = await BikeVariant.findById(variantId);
    if (!variant) {
      const error = new Error('Referenced bike variant not found');
      error.statusCode = 404;
      throw error;
    }
    if (variant.bike.toString() !== bike._id.toString()) {
      const error = new Error('Variant does not belong to the selected bike model');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Verify Showroom if provided
  let showroom = null;
  if (showroomId) {
    showroom = await Showroom.findById(showroomId);
    if (!showroom) {
      const error = new Error('Referenced showroom not found');
      error.statusCode = 404;
      throw error;
    }
  }

  // 4. Verify dates
  const parsedFrom = new Date(validFrom);
  const parsedUntil = new Date(validUntil);
  if (isNaN(parsedFrom.getTime()) || isNaN(parsedUntil.getTime())) {
    const error = new Error('Invalid date range for offer');
    error.statusCode = 400;
    throw error;
  }
  if (parsedUntil < parsedFrom) {
    const error = new Error('Offer validity end date cannot be earlier than start date');
    error.statusCode = 400;
    throw error;
  }

  // 5. Generate / verify slug
  const finalSlug = slug ? slug.toLowerCase().trim() : generateSlug(title);

  const offer = await Offer.create({
    title: title.trim(),
    slug: finalSlug,
    description: description.trim(),
    bike: bike._id,
    variant: variant ? variant._id : null,
    showroom: showroom ? showroom._id : null,
    offerType,
    discountValue: Math.max(0, Number(discountValue) || 0),
    benefits: Array.isArray(benefits) ? benefits : [],
    terms: terms ? terms.trim() : '',
    validFrom: parsedFrom,
    validUntil: parsedUntil,
    isActive
  });

  return getOfferByIdOrSlug(offer._id.toString());
};

module.exports = {
  getOffers,
  getOfferByIdOrSlug,
  createOffer,
  generateSlug
};
