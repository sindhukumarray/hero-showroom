const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Brand, City, Showroom, Bike, BikeVariant, Offer } = require('../models');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { brandsData, citiesData, showroomsData, bikesData, offersData } = require('./seedData');

/**
 * Idempotently seed development demo data into MongoDB.
 * @returns {Promise<{ brands: number, cities: number, showrooms: number, bikes: number, variants: number }>}
 */
const seedDatabase = async () => {
  console.log('\n=====================================================');
  console.log('   HERO SHOWROOM — DEVELOPMENT SEED SYSTEM INITIALIZED ');
  console.log('=====================================================\n');
  console.log('Seed started');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing. Cannot seed database.');
  }

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
    await Showroom.findOneAndUpdate(
      { slug: showroom.slug },
      { $set: showroomPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      showroomStats.updated++;
    } else {
      showroomStats.created++;
    }
  }

  // 4. Seed Bikes & Variants
  console.log('Seeding bikes & variants...');
  const bikeStats = { created: 0, updated: 0 };
  const variantStats = { created: 0, updated: 0 };

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

  // 6. Query and verify final database counts
  const finalBrands = await Brand.countDocuments();
  const finalCities = await City.countDocuments();
  const finalShowrooms = await Showroom.countDocuments();
  const finalBikes = await Bike.countDocuments();
  const finalVariants = await BikeVariant.countDocuments();
  const finalOffers = await Offer.countDocuments();

  console.log('\n-----------------------------------------------------');
  console.log(`Brands: ${finalBrands} (created: ${brandStats.created}, updated/reused: ${brandStats.updated})`);
  console.log(`Cities: ${finalCities} (created: ${cityStats.created}, updated/reused: ${cityStats.updated})`);
  console.log(`Showrooms: ${finalShowrooms} (created: ${showroomStats.created}, updated/reused: ${showroomStats.updated})`);
  console.log(`Bikes: ${finalBikes} (created: ${bikeStats.created}, updated/reused: ${bikeStats.updated})`);
  console.log(`Bike variants: ${finalVariants} (created: ${variantStats.created}, updated/reused: ${variantStats.updated})`);
  console.log(`Offers: ${finalOffers} (created: ${offerStats.created}, updated/reused: ${offerStats.updated})`);
  console.log('-----------------------------------------------------');
  console.log('Seed completed successfully\n');

  return {
    brands: finalBrands,
    cities: finalCities,
    showrooms: finalShowrooms,
    bikes: finalBikes,
    variants: finalVariants,
    offers: finalOffers,
    stats: {
      brands: brandStats,
      cities: cityStats,
      showrooms: showroomStats,
      bikes: bikeStats,
      variants: variantStats,
      offers: offerStats
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
  seedDatabase
};
