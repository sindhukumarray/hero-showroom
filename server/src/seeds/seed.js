const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Brand, City, Showroom, Bike, BikeVariant, Offer, User, Lead, TestRide, Review } = require('../models');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const {
  brandsData,
  citiesData,
  showroomsData,
  bikesData,
  offersData,
  usersData,
  leadsData,
  testRidesData,
  reviewsData
} = require('./seedData');

/**
 * Asserts that the environment is safe for running seed operations.
 * Fails closed if NODE_ENV is production.
 * @throws {Error} if environment is production or MONGODB_URI is missing
 */
const assertSeedAllowed = () => {
  const nodeEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  if (nodeEnv === 'production') {
    throw new Error('Seed execution is strictly prohibited in production environment (NODE_ENV=production). Database seeding aborted.');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing. Cannot seed database.');
  }
};

/**
 * Idempotently seed development demo data into MongoDB.
 * @returns {Promise<{ brands: number, cities: number, showrooms: number, bikes: number, variants: number, offers: number, users: number, leads: number, testRides: number, reviews: number }>}
 */
const seedDatabase = async () => {
  console.log('\n=====================================================');
  console.log('   HERO SHOWROOM — DEVELOPMENT SEED SYSTEM INITIALIZED ');
  console.log('=====================================================\n');
  console.log('Seed started');

  // Fail-closed guard: ensure non-production and URI presence BEFORE connecting
  assertSeedAllowed();

  await connectDatabase();

  // 1. Seed Brands
  console.log('Seeding brands...');
  const brandStats = { created: 0, updated: 0 };
  const brandMap = new Map();
  for (const brand of brandsData) {
    const existing = await Brand.findOne({ slug: brand.slug }).select('_id');
    const doc = await Brand.findOneAndUpdate(
      { slug: brand.slug },
      { $set: brand },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      brandStats.updated++;
    } else {
      brandStats.created++;
    }
    brandMap.set(brand.slug, doc._id);
  }

  // 2. Seed Cities
  console.log('Seeding cities...');
  const cityStats = { created: 0, updated: 0 };
  const cityMap = new Map();
  for (const city of citiesData) {
    const existing = await City.findOne({ slug: city.slug }).select('_id');
    const doc = await City.findOneAndUpdate(
      { slug: city.slug },
      { $set: city },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      cityStats.updated++;
    } else {
      cityStats.created++;
    }
    cityMap.set(city.slug, doc._id);
  }

  // 3. Seed Showrooms
  console.log('Seeding showrooms...');
  const showroomStats = { created: 0, updated: 0 };
  const showroomMap = new Map();
  for (const showroom of showroomsData) {
    const brandId = brandMap.get(showroom.brandSlug);
    const cityId = cityMap.get(showroom.citySlug);

    if (!brandId || !cityId) {
      console.warn(`[Seed Warning] Missing brand (${showroom.brandSlug}) or city (${showroom.citySlug}) reference for showroom ${showroom.name}`);
      continue;
    }

    const { brandSlug, citySlug, ...showroomFields } = showroom;
    const showroomPayload = {
      ...showroomFields,
      brand: brandId,
      city: cityId
    };

    const existing = await Showroom.findOne({ slug: showroom.slug }).select('_id');
    const showroomDoc = await Showroom.findOneAndUpdate(
      { slug: showroom.slug },
      { $set: showroomPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      showroomStats.updated++;
    } else {
      showroomStats.created++;
    }
    showroomMap.set(showroom.slug, showroomDoc._id);
  }

  // 4. Seed Bikes & Variants
  console.log('Seeding bikes & variants...');
  const bikeStats = { created: 0, updated: 0 };
  const variantStats = { created: 0, updated: 0 };
  const bikeMap = new Map();

  for (const bike of bikesData) {
    const brandId = brandMap.get(bike.brandSlug);
    if (!brandId) {
      console.warn(`[Seed Warning] Missing brand (${bike.brandSlug}) reference for bike ${bike.name}`);
      continue;
    }

    const { brandSlug, variants, ...bikeFields } = bike;
    const bikePayload = {
      ...bikeFields,
      brand: brandId
    };

    const existingBike = await Bike.findOne({ slug: bike.slug }).select('_id');
    const bikeDoc = await Bike.findOneAndUpdate(
      { slug: bike.slug },
      { $set: bikePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existingBike) {
      bikeStats.updated++;
    } else {
      bikeStats.created++;
    }
    bikeMap.set(bike.slug, bikeDoc._id);

    if (Array.isArray(variants)) {
      for (const variant of variants) {
        const variantPayload = {
          ...variant,
          bike: bikeDoc._id,
          brand: brandId
        };

        const existingVariant = await BikeVariant.findOne({ bike: bikeDoc._id, slug: variant.slug }).select('_id');
        await BikeVariant.findOneAndUpdate(
          { bike: bikeDoc._id, slug: variant.slug },
          { $set: variantPayload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (existingVariant) {
          variantStats.updated++;
        } else {
          variantStats.created++;
        }
      }
    }
  }

  // 5. Seed Offers
  console.log('Seeding offers...');
  const offerStats = { created: 0, updated: 0 };
  for (const offer of offersData) {
    const bikeDoc = await Bike.findOne({ slug: offer.bikeSlug }).select('_id');
    if (!bikeDoc) {
      console.warn(`[Seed Warning] Missing bike (${offer.bikeSlug}) for offer ${offer.title}`);
      continue;
    }

    let showroomId = null;
    if (offer.showroomSlug) {
      const showroomDoc = await Showroom.findOne({ slug: offer.showroomSlug }).select('_id');
      if (showroomDoc) {
        showroomId = showroomDoc._id;
      }
    }

    const { bikeSlug, showroomSlug, ...offerFields } = offer;
    const offerPayload = {
      ...offerFields,
      bike: bikeDoc._id,
      showroom: showroomId
    };

    const existing = await Offer.findOne({ slug: offer.slug }).select('_id');
    await Offer.findOneAndUpdate(
      { slug: offer.slug },
      { $set: offerPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      offerStats.updated++;
    } else {
      offerStats.created++;
    }
  }

  // 6. Seed Users
  console.log('Seeding users...');
  const userStats = { created: 0, updated: 0 };
  const userMap = new Map();
  for (const user of usersData) {
    const existing = await User.findOne({ email: user.email }).select('_id');
    const userDoc = await User.findOneAndUpdate(
      { email: user.email },
      { $set: user },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      userStats.updated++;
    } else {
      userStats.created++;
    }
    userMap.set(user.email, userDoc._id);
  }

  // 7. Seed Leads
  console.log('Seeding leads...');
  const leadStats = { created: 0, updated: 0 };
  for (const lead of leadsData) {
    const userId = userMap.get(lead.userEmail);
    const showroomId = showroomMap.get(lead.showroomSlug);
    const bikeId = bikeMap.get(lead.bikeSlug);

    if (!userId || !showroomId || !bikeId) {
      console.warn(`[Seed Warning] Missing reference for lead: user=${lead.userEmail}, showroom=${lead.showroomSlug}, bike=${lead.bikeSlug}`);
      continue;
    }

    const { userEmail, showroomSlug, bikeSlug, ...leadFields } = lead;
    const leadPayload = {
      ...leadFields,
      user: userId,
      showroom: showroomId,
      bike: bikeId
    };

    const existing = await Lead.findOne({
      user: userId,
      showroom: showroomId,
      bike: bikeId,
      message: lead.message
    }).select('_id');

    await Lead.findOneAndUpdate(
      {
        user: userId,
        showroom: showroomId,
        bike: bikeId,
        message: lead.message
      },
      { $set: leadPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      leadStats.updated++;
    } else {
      leadStats.created++;
    }
  }

  // 8. Seed Test Rides
  console.log('Seeding test rides...');
  const testRideStats = { created: 0, updated: 0 };
  for (const testRide of testRidesData) {
    const userId = userMap.get(testRide.userEmail);
    const showroomId = showroomMap.get(testRide.showroomSlug);
    const bikeId = bikeMap.get(testRide.bikeSlug);

    if (!userId || !showroomId || !bikeId) {
      console.warn(`[Seed Warning] Missing reference for test ride: user=${testRide.userEmail}, showroom=${testRide.showroomSlug}, bike=${testRide.bikeSlug}`);
      continue;
    }

    const { userEmail, showroomSlug, bikeSlug, ...testRideFields } = testRide;
    const testRidePayload = {
      ...testRideFields,
      user: userId,
      showroom: showroomId,
      bike: bikeId
    };

    const existing = await TestRide.findOne({
      user: userId,
      showroom: showroomId,
      bike: bikeId,
      preferredDate: testRide.preferredDate
    }).select('_id');

    await TestRide.findOneAndUpdate(
      {
        user: userId,
        showroom: showroomId,
        bike: bikeId,
        preferredDate: testRide.preferredDate
      },
      { $set: testRidePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      testRideStats.updated++;
    } else {
      testRideStats.created++;
    }
  }

  // 9. Seed Reviews
  console.log('Seeding reviews...');
  const reviewStats = { created: 0, updated: 0 };
  for (const review of reviewsData) {
    const userId = userMap.get(review.userEmail);
    const showroomId = showroomMap.get(review.showroomSlug);

    if (!userId || !showroomId) {
      console.warn(`[Seed Warning] Missing reference for review: user=${review.userEmail}, showroom=${review.showroomSlug}`);
      continue;
    }

    const { userEmail, showroomSlug, ...reviewFields } = review;
    const reviewPayload = {
      ...reviewFields,
      user: userId,
      showroom: showroomId
    };

    const existing = await Review.findOne({
      user: userId,
      showroom: showroomId
    }).select('_id');

    await Review.findOneAndUpdate(
      {
        user: userId,
        showroom: showroomId
      },
      { $set: reviewPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      reviewStats.updated++;
    } else {
      reviewStats.created++;
    }
  }

  // 10. Query and verify final database counts
  const finalBrands = await Brand.countDocuments();
  const finalCities = await City.countDocuments();
  const finalShowrooms = await Showroom.countDocuments();
  const finalBikes = await Bike.countDocuments();
  const finalVariants = await BikeVariant.countDocuments();
  const finalOffers = await Offer.countDocuments();
  const finalUsers = await User.countDocuments();
  const finalLeads = await Lead.countDocuments();
  const finalTestRides = await TestRide.countDocuments();
  const finalReviews = await Review.countDocuments();

  console.log('\n-----------------------------------------------------');
  console.log(`Brands: ${finalBrands} (created: ${brandStats.created}, updated/reused: ${brandStats.updated})`);
  console.log(`Cities: ${finalCities} (created: ${cityStats.created}, updated/reused: ${cityStats.updated})`);
  console.log(`Showrooms: ${finalShowrooms} (created: ${showroomStats.created}, updated/reused: ${showroomStats.updated})`);
  console.log(`Bikes: ${finalBikes} (created: ${bikeStats.created}, updated/reused: ${bikeStats.updated})`);
  console.log(`Bike variants: ${finalVariants} (created: ${variantStats.created}, updated/reused: ${variantStats.updated})`);
  console.log(`Offers: ${finalOffers} (created: ${offerStats.created}, updated/reused: ${offerStats.updated})`);
  console.log(`Users: ${finalUsers} (created: ${userStats.created}, updated/reused: ${userStats.updated})`);
  console.log(`Leads: ${finalLeads} (created: ${leadStats.created}, updated/reused: ${leadStats.updated})`);
  console.log(`Test Rides: ${finalTestRides} (created: ${testRideStats.created}, updated/reused: ${testRideStats.updated})`);
  console.log(`Reviews: ${finalReviews} (created: ${reviewStats.created}, updated/reused: ${reviewStats.updated})`);
  console.log('-----------------------------------------------------');
  console.log('Seed completed successfully\n');

  return {
    brands: finalBrands,
    cities: finalCities,
    showrooms: finalShowrooms,
    bikes: finalBikes,
    variants: finalVariants,
    offers: finalOffers,
    users: finalUsers,
    leads: finalLeads,
    testRides: finalTestRides,
    reviews: finalReviews,
    stats: {
      brands: brandStats,
      cities: cityStats,
      showrooms: showroomStats,
      bikes: bikeStats,
      variants: variantStats,
      offers: offerStats,
      users: userStats,
      leads: leadStats,
      testRides: testRideStats,
      reviews: reviewStats
    }
  };
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(`\n🚨 [Seed Error] ${error.message}`);
      await disconnectDatabase();
      process.exit(1);
    });
}

module.exports = {
  assertSeedAllowed,
  seedDatabase
};
