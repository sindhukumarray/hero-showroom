const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if available
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { Brand, City, Showroom, Bike, BikeVariant } = require('./src/models');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { brandsData, citiesData, showroomsData, bikesData } = require('./src/seeds/seedData');

async function runLiveDatabaseVerification() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 2 STEP 3 SEED & DB AUDIT ');
  console.log('=====================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  const assert = (condition, description, extra = '') => {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  };

  // Section 1: Seed Dataset Contract Audit (Offline-compatible)
  console.log('1. Auditing Seed Dataset Contract & Relational Integrity (In-Memory):');

  assert(brandsData.length >= 10, `Brands dataset meets PRD requirement (Count: ${brandsData.length} >= 10)`);
  const brandSlugSet = new Set();
  let duplicateBrandSlugs = 0;
  for (const b of brandsData) {
    if (!b.name || !b.slug) duplicateBrandSlugs++;
    if (brandSlugSet.has(b.slug)) duplicateBrandSlugs++;
    brandSlugSet.add(b.slug);
  }
  assert(duplicateBrandSlugs === 0, 'All brand entries have unique slugs and required fields');

  assert(citiesData.length >= 15, `Cities dataset meets PRD requirement (Count: ${citiesData.length} >= 15)`);
  const citySlugSet = new Set();
  let invalidCities = 0;
  for (const c of citiesData) {
    if (!c.name || !c.slug || !c.state || !c.coordinates) invalidCities++;
    if (citySlugSet.has(c.slug)) invalidCities++;
    citySlugSet.add(c.slug);
  }
  assert(invalidCities === 0, 'All city entries have unique slugs and valid coordinates');

  assert(showroomsData.length >= 30, `Showrooms dataset meets PRD requirement (Count: ${showroomsData.length} >= 30)`);
  const showroomSlugSet = new Set();
  let invalidShowrooms = 0;
  let brokenShowroomRefs = 0;
  for (const s of showroomsData) {
    if (!s.name || !s.slug || !s.contact?.phone || !s.address?.fullAddress) invalidShowrooms++;
    if (!s.location?.coordinates || s.location.coordinates.length !== 2) invalidShowrooms++;
    if (showroomSlugSet.has(s.slug)) invalidShowrooms++;
    showroomSlugSet.add(s.slug);

    if (!brandSlugSet.has(s.brandSlug) || !citySlugSet.has(s.citySlug)) {
      brokenShowroomRefs++;
    }
  }
  assert(invalidShowrooms === 0, 'All showroom entries have unique slugs, full addresses, and GeoJSON [lng, lat]');
  assert(brokenShowroomRefs === 0, 'Every showroom references a valid Brand and City in seedData');

  assert(bikesData.length >= 30, `Bikes dataset meets PRD requirement (Count: ${bikesData.length} >= 30)`);
  const bikeSlugSet = new Set();
  let invalidBikes = 0;
  let brokenBikeRefs = 0;
  let totalVariants = 0;
  let bikesWithUnderTwoVariants = 0;
  let invalidVariants = 0;

  for (const bk of bikesData) {
    if (!bk.name || !bk.slug || !bk.category || !bk.priceRange?.minPrice || !bk.priceRange?.maxPrice) {
      invalidBikes++;
    }
    if (bk.priceRange?.minPrice > bk.priceRange?.maxPrice) {
      invalidBikes++;
    }
    if (bikeSlugSet.has(bk.slug)) invalidBikes++;
    bikeSlugSet.add(bk.slug);

    if (!brandSlugSet.has(bk.brandSlug)) {
      brokenBikeRefs++;
    }

    if (!Array.isArray(bk.variants) || bk.variants.length < 2) {
      bikesWithUnderTwoVariants++;
    } else {
      const variantSlugSet = new Set();
      for (const v of bk.variants) {
        totalVariants++;
        if (!v.name || !v.slug || typeof v.exShowroomPrice !== 'number' || v.exShowroomPrice <= 0) {
          invalidVariants++;
        }
        if (v.exShowroomPrice < bk.priceRange.minPrice || v.exShowroomPrice > bk.priceRange.maxPrice) {
          invalidVariants++;
        }
        if (variantSlugSet.has(v.slug)) {
          invalidVariants++;
        }
        variantSlugSet.add(v.slug);
      }
    }
  }
  assert(invalidBikes === 0, 'All bike entries have unique slugs, valid categories, and minPrice <= maxPrice');
  assert(brokenBikeRefs === 0, 'Every bike model references a valid Brand in seedData');
  assert(bikesWithUnderTwoVariants === 0, 'Every bike model has at least 2 variants defined');
  assert(totalVariants >= 60, `Bike variants total meets requirement (Found: ${totalVariants}, Expected >= 60)`);
  assert(invalidVariants === 0, 'All variants have valid names, unique slugs per bike, and prices within priceRange');

  console.log('\n=====================================================');
  console.log(`SEED DATA CONTRACT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================\n');

  if (failed > 0) {
    console.error(`🚨 Seed dataset contract validation failed with ${failed} errors.`);
    process.exit(1);
  }

  // Section 2: Real MongoDB Cluster Verification (requires MONGODB_URI)
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('ℹ️  [LIVE DB TEST SKIPPED]');
    console.log('   MONGODB_URI is not configured in the environment.');
    console.log('   Skipping live MongoDB cluster tests to preserve offline test compatibility.');
    console.log('   (To execute live tests, configure MONGODB_URI in server/.env and run: npm run seed)\n');
    process.exit(0);
  }

  try {
    // 2. Establish Real Database Connection
    console.log('2. Connecting to Real MongoDB Cluster...');
    await connectDatabase();
    assert(isConnected(), 'Database connection established and readyState is 1 (Connected)');

    // 2. Audit Seed Record Counts
    console.log('\n2. Auditing Seed Dataset Document Counts:');
    const brandCount = await Brand.countDocuments();
    assert(brandCount >= 10, `Brand count meets or exceeds requirement (Found: ${brandCount}, Expected >= 10)`);

    const cityCount = await City.countDocuments();
    assert(cityCount >= 15, `City count meets or exceeds requirement (Found: ${cityCount}, Expected >= 15)`);

    const showroomCount = await Showroom.countDocuments();
    assert(showroomCount >= 30, `Showroom count meets or exceeds requirement (Found: ${showroomCount}, Expected >= 30)`);

    const bikeCount = await Bike.countDocuments();
    assert(bikeCount >= 30, `Bike count meets or exceeds requirement (Found: ${bikeCount}, Expected >= 30)`);

    const variantCount = await BikeVariant.countDocuments();
    assert(variantCount >= 60, `BikeVariant total count meets requirement (Found: ${variantCount}, Expected >= 60)`);

    // Verify every bike has at least 2 variants
    console.log('\n3. Auditing Variant Count Per Bike:');
    const allBikes = await Bike.find().select('_id name slug').lean();
    let bikesWithUnderTwoVariants = 0;

    for (const b of allBikes) {
      const vCount = await BikeVariant.countDocuments({ bike: b._id });
      if (vCount < 2) {
        bikesWithUnderTwoVariants++;
      }
    }
    assert(bikesWithUnderTwoVariants === 0, 'Every bike model has at least 2 variants associated with it');

    // 4. Audit Relationship Integrity
    console.log('\n4. Auditing Model Relationship Integrity:');
    const sampleShowroom = await Showroom.findOne().populate('brand').populate('city').lean();
    assert(
      Boolean(sampleShowroom && sampleShowroom.brand && sampleShowroom.brand.name),
      `Showroom '${sampleShowroom?.name}' resolves valid Brand relationship ('${sampleShowroom?.brand?.name}')`
    );
    assert(
      Boolean(sampleShowroom && sampleShowroom.city && sampleShowroom.city.name),
      `Showroom '${sampleShowroom?.name}' resolves valid City relationship ('${sampleShowroom?.city?.name}')`
    );

    const sampleBike = await Bike.findOne().populate('brand').lean();
    assert(
      Boolean(sampleBike && sampleBike.brand && sampleBike.brand.name),
      `Bike '${sampleBike?.name}' resolves valid Brand relationship ('${sampleBike?.brand?.name}')`
    );

    const sampleVariant = await BikeVariant.findOne().populate('bike').populate('brand').lean();
    assert(
      Boolean(sampleVariant && sampleVariant.bike && sampleVariant.bike.name),
      `BikeVariant '${sampleVariant?.name}' resolves valid Bike relationship ('${sampleVariant?.bike?.name}')`
    );

    // 5. Test Live Catalogue API Endpoints through Express
    console.log('\n5. Setting up Ephemeral Server to Test Catalogue APIs on Live Data:');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const makeRequest = (path) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            host: '127.0.0.1',
            port: port,
            path: path,
            method: 'GET'
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(body) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: body });
              }
            });
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // Test GET /api/brands
    console.log('\n6. Auditing Live API Endpoints:');
    const brandsRes = await makeRequest('/api/brands?page=1&limit=10');
    assert(
      brandsRes.status === 200 && brandsRes.data.success && brandsRes.data.data.length >= 10,
      `GET /api/brands reads live seeded brands (Retrieved: ${brandsRes.data?.data?.length})`
    );

    // Test GET /api/cities
    const citiesRes = await makeRequest('/api/cities?page=1&limit=15');
    assert(
      citiesRes.status === 200 && citiesRes.data.success && citiesRes.data.data.length >= 15,
      `GET /api/cities reads live seeded cities (Retrieved: ${citiesRes.data?.data?.length})`
    );

    // Test GET /api/showrooms
    const showroomsRes = await makeRequest('/api/showrooms?page=1&limit=20');
    assert(
      showroomsRes.status === 200 && showroomsRes.data.success && showroomsRes.data.data.length >= 20,
      `GET /api/showrooms reads live seeded showrooms (Retrieved: ${showroomsRes.data?.data?.length})`
    );

    // Test GET /api/bikes
    const bikesRes = await makeRequest('/api/bikes?page=1&limit=20');
    assert(
      bikesRes.status === 200 && bikesRes.data.success && bikesRes.data.data.length >= 20,
      `GET /api/bikes reads live seeded bikes (Retrieved: ${bikesRes.data?.data?.length})`
    );

    // Test Specific Slug Lookups
    console.log('\n7. Auditing Specific Slug Lookups on Live Data:');
    const sampleBrandDoc = await Brand.findOne({ slug: 'hero-motocorp' }).lean();
    const brandSlugRes = await makeRequest(`/api/brands/${sampleBrandDoc.slug}`);
    assert(
      brandSlugRes.status === 200 && brandSlugRes.data.data.slug === sampleBrandDoc.slug,
      `GET /api/brands/${sampleBrandDoc.slug} returns matching live brand`
    );

    const sampleCityDoc = await City.findOne({ slug: 'mumbai' }).lean();
    const citySlugRes = await makeRequest(`/api/cities/${sampleCityDoc.slug}`);
    assert(
      citySlugRes.status === 200 && citySlugRes.data.data.slug === sampleCityDoc.slug,
      `GET /api/cities/${sampleCityDoc.slug} returns matching live city`
    );

    const sampleShowroomDoc = await Showroom.findOne().lean();
    const showroomSlugRes = await makeRequest(`/api/showrooms/${sampleShowroomDoc.slug}`);
    assert(
      showroomSlugRes.status === 200 && showroomSlugRes.data.data.slug === sampleShowroomDoc.slug,
      `GET /api/showrooms/${sampleShowroomDoc.slug} returns matching live showroom`
    );

    const sampleBikeDoc = await Bike.findOne({ slug: 'hero-splendor-plus' }).lean();
    const bikeSlugRes = await makeRequest(`/api/bikes/${sampleBikeDoc.slug}`);
    assert(
      bikeSlugRes.status === 200 && bikeSlugRes.data.data.slug === sampleBikeDoc.slug,
      `GET /api/bikes/${sampleBikeDoc.slug} returns matching live bike`
    );

    const variantsRes = await makeRequest(`/api/bikes/${sampleBikeDoc.slug}/variants`);
    assert(
      variantsRes.status === 200 &&
        variantsRes.data.success &&
        Array.isArray(variantsRes.data.data) &&
        variantsRes.data.data.length >= 2,
      `GET /api/bikes/${sampleBikeDoc.slug}/variants returns variants for live bike (Found: ${variantsRes.data?.data?.length})`
    );

    // Teardown
    server.close();
    await disconnectDatabase();

    // Summary
    console.log('\n=====================================================');
    console.log(`TOTAL REAL DB CHECKS: ${checks}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('=====================================================');

    if (failed === 0) {
      console.log('\n🎉 ALL REAL MONGODB VERIFICATION CHECKS PASSED!\n');
      process.exit(0);
    } else {
      console.error(`\n🚨 REAL DB VERIFICATION FAILED WITH ${failed} ERRORS\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n🚨 [Real DB Verification Fatal Error] ${error.message}`);
    await disconnectDatabase();
    process.exit(1);
  }
}

runLiveDatabaseVerification().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
