const {
  User,
  Lead,
  TestRide,
  Review,
  Showroom,
  Bike,
  BikeVariant,
  Offer,
  Brand,
  City
} = require('../models');
const { LEAD_STATUS } = require('../constants/leads');
const { REVIEW_STATUS } = require('../constants/reviews');
const { TEST_RIDE_STATUS } = require('../constants/testRides');

/**
 * Admin Service
 * Provides administrative foundation operations, platform access verification,
 * high-level system telemetry, and comprehensive dashboard metrics.
 */

/**
 * Verify administrative access and retrieve caller identity metadata
 * @param {string} adminUserId - Authenticated admin MongoDB ObjectId
 * @returns {Promise<object>} Admin session status confirmation
 */
const getAdminStatus = async (adminUserId) => {
  const adminUser = await User.findById(adminUserId).select('name email role isActive createdAt').lean();

  return {
    verified: true,
    system: 'Hero Showroom Administrative Engine',
    version: '1.0.0',
    admin: adminUser ? {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive
    } : null,
    serverTime: new Date().toISOString()
  };
};

/**
 * Calculate and return aggregate dashboard metrics across all core domain entities.
 * Uses optimized count queries and aggregation pipelines without loading documents into memory.
 * @returns {Promise<object>} Structured dashboard metrics
 */
const getDashboardMetrics = async () => {
  const now = new Date();

  const [
    // Overview & Users
    totalUsers,
    activeUsers,

    // Leads
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    convertedLeads,
    closedLeads,

    // Reviews
    totalReviews,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    reviewRatingAggregation,

    // Test Rides
    totalTestRides,
    requestedRides,
    confirmedRides,
    completedRides,
    cancelledRides,

    // Catalogue: Brands
    totalBrands,
    activeBrands,

    // Catalogue: Cities
    totalCities,
    activeCities,

    // Catalogue: Showrooms
    totalShowrooms,
    activeShowrooms,

    // Catalogue: Bikes & Variants
    totalBikes,
    activeBikes,
    featuredBikes,
    totalVariants,
    activeVariants,

    // Offers
    totalOffers,
    activeOffers
  ] = await Promise.all([
    // Users
    User.countDocuments(),
    User.countDocuments({ isActive: true }),

    // Leads
    Lead.countDocuments(),
    Lead.countDocuments({ status: LEAD_STATUS.NEW }),
    Lead.countDocuments({ status: LEAD_STATUS.CONTACTED }),
    Lead.countDocuments({ status: LEAD_STATUS.QUALIFIED }),
    Lead.countDocuments({ status: LEAD_STATUS.CONVERTED }),
    Lead.countDocuments({ status: LEAD_STATUS.CLOSED }),

    // Reviews
    Review.countDocuments(),
    Review.countDocuments({ status: REVIEW_STATUS.PENDING }),
    Review.countDocuments({ status: REVIEW_STATUS.APPROVED }),
    Review.countDocuments({ status: REVIEW_STATUS.REJECTED }),
    Review.aggregate([
      { $match: { status: REVIEW_STATUS.APPROVED } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),

    // Test Rides
    TestRide.countDocuments(),
    TestRide.countDocuments({ status: TEST_RIDE_STATUS.REQUESTED }),
    TestRide.countDocuments({ status: TEST_RIDE_STATUS.CONFIRMED }),
    TestRide.countDocuments({ status: TEST_RIDE_STATUS.COMPLETED }),
    TestRide.countDocuments({ status: TEST_RIDE_STATUS.CANCELLED }),

    // Brands
    Brand.countDocuments(),
    Brand.countDocuments({ isActive: true }),

    // Cities
    City.countDocuments(),
    City.countDocuments({ isActive: true }),

    // Showrooms
    Showroom.countDocuments(),
    Showroom.countDocuments({ isActive: true }),

    // Bikes
    Bike.countDocuments(),
    Bike.countDocuments({ isActive: true }),
    Bike.countDocuments({ isFeatured: true, isActive: true }),

    // Variants
    BikeVariant.countDocuments(),
    BikeVariant.countDocuments({ isActive: true }),

    // Offers
    Offer.countDocuments(),
    Offer.countDocuments({ isActive: true, validUntil: { $gte: now } })
  ]);

  const rawAvg = reviewRatingAggregation?.[0]?.avgRating;
  const averageRating = rawAvg ? Math.round(rawAvg * 10) / 10 : 0;

  return {
    overview: {
      totalUsers,
      totalLeads,
      totalTestRides,
      totalReviews,
      totalShowrooms,
      totalBikes,
      totalOffers
    },
    leads: {
      total: totalLeads,
      new: newLeads,
      contacted: contactedLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      closed: closedLeads
    },
    reviews: {
      total: totalReviews,
      pending: pendingReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      averageRating
    },
    testRides: {
      total: totalTestRides,
      requested: requestedRides,
      confirmed: confirmedRides,
      completed: completedRides,
      cancelled: cancelledRides
    },
    catalogue: {
      totalBrands,
      activeBrands,
      totalCities,
      activeCities,
      totalShowrooms,
      activeShowrooms,
      totalBikes,
      activeBikes,
      featuredBikes,
      totalVariants,
      activeVariants
    },
    offers: {
      total: totalOffers,
      active: activeOffers
    }
  };
};

module.exports = {
  getAdminStatus,
  getDashboardMetrics
};
