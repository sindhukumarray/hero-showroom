const { Lead, User, Showroom, Bike, BikeVariant, Offer } = require('../models');
const { isConnected } = require('../config/database');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../constants/notifications');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Lead._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Service: Create a customer lead enquiry with full relationship validation.
 * @param {object} params
 * @returns {Promise<object>} Created populated lead document
 */
const createLead = async ({
  userId,
  name,
  email,
  phone,
  showroomId,
  bikeId,
  variantId,
  offerId = null,
  source = 'showroom',
  message = ''
}) => {
  assertDatabaseConnected();

  // 1. Verify authenticated user identity and account activity
  const user = await User.findById(userId);
  if (!user || user.isActive === false) {
    const error = new Error('Authenticated user account is inactive or not found');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify referenced showroom existence and operational status
  const showroom = await Showroom.findById(showroomId);
  if (!showroom) {
    const error = new Error('Showroom not found');
    error.statusCode = 404;
    throw error;
  }
  if (showroom.isActive === false) {
    const error = new Error('Showroom is currently inactive and cannot accept enquiries');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify referenced bike model existence and active status
  const bike = await Bike.findById(bikeId);
  if (!bike) {
    const error = new Error('Bike not found');
    error.statusCode = 404;
    throw error;
  }
  if (bike.isActive === false) {
    const error = new Error('Bike model is currently inactive');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify optional variant relationship integrity
  let variant = null;
  if (variantId) {
    variant = await BikeVariant.findById(variantId);
    if (!variant) {
      const error = new Error('Bike variant not found');
      error.statusCode = 404;
      throw error;
    }
    if (variant.bike.toString() !== bike._id.toString()) {
      const error = new Error('Variant does not belong to the selected bike model');
      error.statusCode = 400;
      throw error;
    }
    if (variant.isActive === false) {
      const error = new Error('Bike variant is currently inactive');
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Verify optional offer relationship integrity
  let offer = null;
  if (offerId) {
    offer = await Offer.findById(offerId);
    if (!offer) {
      const error = new Error('Offer not found');
      error.statusCode = 404;
      throw error;
    }
    if (offer.isActive === false) {
      const error = new Error('Offer is currently inactive');
      error.statusCode = 400;
      throw error;
    }
    if (offer.validUntil && new Date(offer.validUntil) < new Date()) {
      const error = new Error('Offer has expired');
      error.statusCode = 400;
      throw error;
    }
    if (offer.bike.toString() !== bike._id.toString()) {
      const error = new Error('Offer does not apply to the selected bike model');
      error.statusCode = 400;
      throw error;
    }
  }

  // 6. Persist lead enquiry strictly with status="new" and server-assigned user
  const lead = await Lead.create({
    user: user._id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : (user.phone || ''),
    showroom: showroom._id,
    bike: bike._id,
    variant: variant ? variant._id : null,
    offer: offer ? offer._id : null,
    source,
    status: 'new',
    message: message ? message.trim() : ''
  });

  // 7. Return populated document without sensitive credentials
  const populated = await Lead.findById(lead._id)
    .populate('user', 'name email phone')
    .populate('showroom', 'name slug address contact showroomType isActive')
    .populate('bike', 'name slug category images priceRange isActive')
    .populate('variant', 'name trim exShowroomPrice isActive')
    .populate('offer', 'title slug offerType discountValue validUntil');

  // 8. Safely create customer notification without interrupting lead flow
  try {
    const isOffer = Boolean(offer);
    const bikeTitle = bike ? bike.name : 'Motorcycle';
    const showroomTitle = showroom ? showroom.name : 'Authorized Showroom';

    await notificationService.createNotification({
      userId: user._id,
      type: isOffer ? NOTIFICATION_TYPES.OFFER : NOTIFICATION_TYPES.LEAD,
      title: isOffer ? 'Special Offer Enquiry Submitted' : 'Dealership Enquiry Submitted',
      message: isOffer
        ? `Your enquiry for special offer "${offer?.title || 'Offer'}" on ${bikeTitle} at ${showroomTitle} has been received.`
        : `Your enquiry for ${bikeTitle} at ${showroomTitle} has been received.`,
      relatedEntity: lead._id,
      relatedEntityType: 'Lead',
      metadata: {
        leadId: lead._id,
        showroomId: showroom._id,
        showroomName: showroom.name,
        bikeId: bike._id,
        bikeName: bike.name,
        offerId: offer ? offer._id : null
      }
    });
  } catch (notifErr) {
    // Non-blocking notification failure
  }

  return populated;
};

/**
 * Service: Retrieve paginated leads for the authenticated customer only.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getUserLeads = async ({ userId, page = 1, limit = 20 }) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: userId };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('showroom', 'name slug address contact showroomType')
      .populate('bike', 'name slug category images priceRange')
      .populate('variant', 'name trim exShowroomPrice')
      .populate('offer', 'title slug offerType discountValue validUntil')
      .select('-__v')
      .lean(),
    Lead.countDocuments(filter)
  ]);

  return {
    data: leads,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Escapes regex special characters to prevent ReDoS and injection.
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const LEAD_SORT_MAP = {
  newest: { createdAt: -1, _id: 1 },
  oldest: { createdAt: 1, _id: 1 },
  status: { status: 1, createdAt: -1, _id: 1 },
  name: { name: 1, _id: 1 }
};

/**
 * Service: Retrieve paginated leads for admin console with administrative filters.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getAdminLeads = async ({
  page = 1,
  limit = 20,
  status,
  source,
  showroom,
  bike,
  user,
  search,
  sort = 'newest',
  startDate,
  endDate
} = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (source && source !== 'all') {
    filter.source = source;
  }

  if (showroom && showroom !== 'all') {
    filter.showroom = showroom;
  }

  if (bike && bike !== 'all') {
    filter.bike = bike;
  }

  if (user && user !== 'all') {
    filter.user = user;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endD;
    }
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitized = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: new RegExp(sanitized, 'i') } },
      { email: { $regex: new RegExp(sanitized, 'i') } },
      { phone: { $regex: new RegExp(sanitized, 'i') } },
      { message: { $regex: new RegExp(sanitized, 'i') } }
    ];
  }

  const sortCriteria = LEAD_SORT_MAP[sort] || LEAD_SORT_MAP.newest;

  const [data, total] = await Promise.all([
    Lead.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone role isActive')
      .populate('showroom', 'name slug address contact showroomType city')
      .populate('bike', 'name slug category images priceRange brand')
      .populate('variant', 'name slug exShowroomPrice colors')
      .populate('offer', 'title slug discountValue validUntil')
      .select('-__v')
      .lean(),
    Lead.countDocuments(filter)
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
 * Service: Retrieve single lead by ID with populated details.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getLeadById = async (id) => {
  assertDatabaseConnected();

  if (!id) return null;

  return Lead.findById(id)
    .populate('user', 'name email phone role isActive createdAt')
    .populate('showroom', 'name slug address contact showroomType city location openingHours')
    .populate('bike', 'name slug category images priceRange brand fuelType engine transmission')
    .populate('variant', 'name slug exShowroomPrice colors keySpecifications keyFeatures')
    .populate('offer', 'title slug discountValue validUntil description')
    .select('-__v')
    .lean();
};

/**
 * Service: Update lead status.
 * @param {string} id
 * @param {string} status
 * @returns {Promise<object>}
 */
const updateLeadStatus = async (id, status) => {
  assertDatabaseConnected();

  const lead = await Lead.findById(id);
  if (!lead) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  lead.status = status;
  await lead.save();

  return Lead.findById(id)
    .populate('user', 'name email phone role isActive')
    .populate('showroom', 'name slug address contact showroomType city')
    .populate('bike', 'name slug category images priceRange brand')
    .populate('variant', 'name slug exShowroomPrice colors')
    .populate('offer', 'title slug discountValue validUntil')
    .select('-__v')
    .lean();
};

module.exports = {
  createLead,
  getUserLeads,
  getAdminLeads,
  getLeadById,
  updateLeadStatus,
  escapeRegex,
  LEAD_SORT_MAP
};

