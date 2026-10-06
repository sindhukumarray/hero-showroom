const { Brand, Showroom, Bike, BikeVariant } = require('../models');
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
 * Retrieve paginated brands with optional filtering (Public).
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

  const filter = {};

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
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
 * Retrieve a single brand by slug (Public).
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

/**
 * Retrieve a single brand by MongoDB ObjectId (Admin).
 * @param {string} id
 * @returns {Promise<object>}
 */
const getBrandById = async (id) => {
  assertDatabaseConnected();

  const brand = await Brand.findById(id).select('-__v').lean();
  if (!brand) {
    const error = new Error('Brand not found');
    error.statusCode = 404;
    throw error;
  }

  return brand;
};

/**
 * Create a new brand (Admin).
 * @param {object} payload
 * @returns {Promise<object>} Created brand
 */
const createBrand = async (payload) => {
  assertDatabaseConnected();

  const { name, slug, description, originCountry, website, logo, isActive } = payload;

  // Check unique name or slug conflict
  const existing = await Brand.findOne({
    $or: [{ slug }, { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } }]
  });

  if (existing) {
    const isSlugConflict = existing.slug === slug;
    const error = new Error(
      isSlugConflict
        ? `A brand with the slug '${slug}' already exists.`
        : `A brand with the name '${name}' already exists.`
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    const brand = await Brand.create({
      name,
      slug,
      description: description || '',
      originCountry: originCountry || 'India',
      website: website || '',
      logo: logo || '',
      isActive: isActive !== undefined ? isActive : true
    });

    return brand;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('A brand with this name or slug already exists.');
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

/**
 * Update an existing brand (Admin).
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>} Updated brand
 */
const updateBrand = async (id, payload) => {
  assertDatabaseConnected();

  const brand = await Brand.findById(id);
  if (!brand) {
    const error = new Error('Brand not found');
    error.statusCode = 404;
    throw error;
  }

  const { name, slug, description, originCountry, website, logo, isActive } = payload;

  // Check unique constraints if name or slug are being modified
  if (name || slug) {
    const query = { _id: { $ne: id }, $or: [] };
    if (name) {
      query.$or.push({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
    }
    if (slug) {
      query.$or.push({ slug });
    }

    const existing = await Brand.findOne(query);
    if (existing) {
      const isSlugConflict = existing.slug === slug;
      const error = new Error(
        isSlugConflict
          ? `A brand with the slug '${slug}' already exists.`
          : `A brand with the name '${name}' already exists.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (name !== undefined) brand.name = name;
  if (slug !== undefined) brand.slug = slug;
  if (description !== undefined) brand.description = description;
  if (originCountry !== undefined) brand.originCountry = originCountry;
  if (website !== undefined) brand.website = website;
  if (logo !== undefined) brand.logo = logo;
  if (isActive !== undefined) brand.isActive = isActive;

  try {
    await brand.save();
    return brand;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('A brand with this name or slug already exists.');
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
};

/**
 * Specifically toggle/set brand active status (Admin).
 * @param {string} id
 * @param {boolean} isActive
 * @returns {Promise<object>}
 */
const updateBrandStatus = async (id, isActive) => {
  assertDatabaseConnected();

  const brand = await Brand.findById(id);
  if (!brand) {
    const error = new Error('Brand not found');
    error.statusCode = 404;
    throw error;
  }

  brand.isActive = isActive;
  await brand.save();
  return brand;
};

/**
 * Delete or safe-deactivate brand (Admin).
 * Enforces catalogue referential integrity: if brand is referenced by Showroom, Bike, or BikeVariant,
 * applies safe deactivation instead of destructive deletion to prevent orphaned records.
 * @param {string} id
 * @returns {Promise<{ deleted: boolean, deactivated: boolean, message: string, brand?: object }>}
 */
const deleteBrand = async (id) => {
  assertDatabaseConnected();

  const brand = await Brand.findById(id);
  if (!brand) {
    const error = new Error('Brand not found');
    error.statusCode = 404;
    throw error;
  }

  // Inspect catalogue references
  const [showroomCount, bikeCount, variantCount] = await Promise.all([
    Showroom.countDocuments({ brand: id }),
    Bike.countDocuments({ brand: id }),
    BikeVariant.countDocuments({ brand: id })
  ]);

  const totalReferences = showroomCount + bikeCount + variantCount;

  if (totalReferences > 0) {
    // Safe deactivation policy
    brand.isActive = false;
    await brand.save();

    return {
      deleted: false,
      deactivated: true,
      message: `Brand is referenced by existing catalogue records (${showroomCount} showrooms, ${bikeCount} bikes, ${variantCount} variants). Safe deactivation applied to prevent orphaned references.`,
      brand
    };
  }

  // Safe hard delete when no references exist
  await Brand.findByIdAndDelete(id);

  return {
    deleted: true,
    deactivated: false,
    message: 'Brand deleted successfully'
  };
};

module.exports = {
  getBrands,
  getBrandBySlug,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
  deleteBrand,
  escapeRegex
};
