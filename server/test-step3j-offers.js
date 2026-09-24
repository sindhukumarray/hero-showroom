const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { Offer, Bike, BikeVariant, Showroom, Brand, City, User, Lead } = require('./src/models');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const { OFFER_TYPES } = require('./src/constants/offers');
const offerService = require('./src/services/offerService');

let server;
let baseUrl;

const makeRequest = (method, endpoint, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runOfferTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 10 OFFERS BACKEND AUDIT           ');
  console.log('================================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  };

  try {
    // 1. Connect Database
    console.log('1. Connecting to Database for Step 3J Audit:');
    await connectDatabase();
    assert(mongoose.connection.readyState === 1, 'Database connected successfully for Offers testing');

    // 2. Spin up ephemeral server
    console.log('\n2. Setting up Ephemeral HTTP Server:');
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`  Live test server listening on ${baseUrl}`);
        resolve();
      });
    });

    // 3. Prepare Fixtures
    console.log('\n3. Preparing Test Fixtures (Bikes, Variants, Showrooms):');
    let testBrand = await Brand.findOne();
    if (!testBrand) {
      testBrand = await Brand.create({
        name: 'Test Brand Offers',
        slug: 'test-brand-offers-' + Date.now(),
        country: 'India'
      });
    }

    let testCity = await City.findOne();
    if (!testCity) {
      testCity = await City.create({
        name: 'Test City Offers',
        slug: 'test-city-offers-' + Date.now(),
        state: 'Delhi'
      });
    }

    let testBike1 = await Bike.create({
      name: 'Offer Test Bike Alpha',
      slug: 'offer-test-bike-alpha-' + Date.now(),
      brand: testBrand._id,
      category: 'Commuter',
      fuelType: 'Petrol',
      priceRange: { minPrice: 80000, maxPrice: 95000 },
      engine: { displacementCc: 125 }
    });

    let testBike2 = await Bike.create({
      name: 'Offer Test Bike Beta',
      slug: 'offer-test-bike-beta-' + Date.now(),
      brand: testBrand._id,
      category: 'Sport',
      fuelType: 'Petrol',
      priceRange: { minPrice: 140000, maxPrice: 160000 },
      engine: { displacementCc: 200 }
    });

    let testVariant1 = await BikeVariant.create({
      bike: testBike1._id,
      brand: testBrand._id,
      name: 'Alpha Standard',
      slug: 'alpha-standard-' + Date.now(),
      trim: 'Drum Brake',
      exShowroomPrice: 82000
    });

    let testVariant2 = await BikeVariant.create({
      bike: testBike2._id,
      brand: testBrand._id,
      name: 'Beta Pro',
      slug: 'beta-pro-' + Date.now(),
      trim: 'Dual ABS',
      exShowroomPrice: 155000
    });

    let testShowroom = await Showroom.create({
      name: 'Hero Test Offer Dealership',
      slug: 'hero-test-offer-dealership-' + Date.now(),
      brand: testBrand._id,
      city: testCity._id,
      address: { fullAddress: '123 Test Boulevard, City Center' },
      contact: { phone: '+919988776655' }
    });

    assert(testBike1 && testBike2 && testShowroom, 'Fixtures created successfully');

    // 4. Test Model Loading & Basic Schema Validations
    console.log('\n4. Auditing Offer Model & Validations:');
    assert(Offer !== undefined && typeof Offer.find === 'function', 'Offer model loaded successfully');

    // Valid Offer Creation via service
    const tomorrow = new Date(Date.now() + 86400000 * 30);
    const yesterday = new Date(Date.now() - 86400000);
    const wayPast = new Date(Date.now() - 86400000 * 10);

    const activeOffer1 = await offerService.createOffer({
      title: 'Festive Cash Discount on Alpha',
      slug: 'festive-discount-alpha-' + Date.now(),
      description: 'Get instant cash discount of Rs 5000 on purchase of Alpha 125.',
      bike: testBike1._id,
      variant: testVariant1._id,
      showroom: testShowroom._id,
      offerType: OFFER_TYPES.DISCOUNT,
      discountValue: 5000,
      benefits: ['Free 1-year RSA', 'Helmet Voucher'],
      terms: 'Valid on cash purchase only.',
      validFrom: yesterday,
      validUntil: tomorrow,
      isActive: true
    });

    assert(activeOffer1 && activeOffer1._id, 'Active offer created successfully');
    assert(activeOffer1.slug.includes('festive-discount-alpha'), 'Offer slug generated correctly');
    assert(activeOffer1.discountValue === 5000, 'Discount value recorded accurately');

    const activeOffer2 = await offerService.createOffer({
      title: 'Exchange Carnival for Beta',
      slug: 'exchange-carnival-beta-' + Date.now(),
      description: 'Exchange bonus up to Rs 8000 when trading in your old 2-wheeler.',
      bike: testBike2._id,
      variant: testVariant2._id,
      showroom: null, // nationwide/all showrooms
      offerType: OFFER_TYPES.EXCHANGE,
      discountValue: 8000,
      benefits: ['Free Evaluation'],
      validFrom: yesterday,
      validUntil: tomorrow,
      isActive: true
    });

    assert(activeOffer2 && activeOffer2.showroom === null, 'Offer without showroom constraint created successfully');

    // Expired Offer
    const expiredOffer = await offerService.createOffer({
      title: 'Expired Monsoon Offer',
      slug: 'expired-monsoon-offer-' + Date.now(),
      description: 'Past promotional campaign that has already concluded.',
      bike: testBike1._id,
      offerType: OFFER_TYPES.SPECIAL,
      discountValue: 2000,
      validFrom: wayPast,
      validUntil: yesterday,
      isActive: true
    });

    assert(expiredOffer && expiredOffer._id, 'Expired offer created for date filter testing');

    // 5. Auditing Validation Constraints
    console.log('\n5. Auditing Validation Failures & Edge Cases:');

    // Invalid date range (validUntil < validFrom)
    let dateRangeFailed = false;
    try {
      await offerService.createOffer({
        title: 'Invalid Date Offer',
        description: 'Should fail due to reversed dates',
        bike: testBike1._id,
        offerType: OFFER_TYPES.DISCOUNT,
        validFrom: tomorrow,
        validUntil: yesterday
      });
    } catch (err) {
      dateRangeFailed = true;
      assert(err.statusCode === 400, 'Invalid date range rejected with HTTP 400');
    }
    assert(dateRangeFailed, 'Reversed date range was caught');

    // Variant mismatch (Variant belongs to Bike 2, not Bike 1)
    let variantMismatchFailed = false;
    try {
      await offerService.createOffer({
        title: 'Mismatched Variant Offer',
        description: 'Should fail because variant does not belong to bike',
        bike: testBike1._id,
        variant: testVariant2._id, // Belongs to testBike2
        offerType: OFFER_TYPES.DISCOUNT,
        validUntil: tomorrow
      });
    } catch (err) {
      variantMismatchFailed = true;
      assert(err.statusCode === 400, 'Variant mismatch rejected with HTTP 400');
    }
    assert(variantMismatchFailed, 'Mismatched variant was caught');

    // Nonexistent bike
    let bikeNotFoundFailed = false;
    try {
      await offerService.createOffer({
        title: 'Ghost Bike Offer',
        description: 'Should fail because bike does not exist',
        bike: new mongoose.Types.ObjectId(),
        offerType: OFFER_TYPES.DISCOUNT,
        validUntil: tomorrow
      });
    } catch (err) {
      bikeNotFoundFailed = true;
      assert(err.statusCode === 404, 'Nonexistent bike rejected with HTTP 404');
    }
    assert(bikeNotFoundFailed, 'Nonexistent bike reference was caught');

    // 6. Testing Public API Endpoints
    console.log('\n6. Auditing GET /api/offers HTTP API:');

    // GET /api/offers default (active offers only)
    const listRes = await makeRequest('GET', '/api/offers');
    assert(listRes.status === 200, 'GET /api/offers returns HTTP 200');
    assert(listRes.data.success === true, 'GET /api/offers returns success: true');
    assert(Array.isArray(listRes.data.data), 'GET /api/offers returns data as an array');

    const listedSlugs = listRes.data.data.map((o) => o.slug);
    assert(listedSlugs.includes(activeOffer1.slug), 'Default active list includes activeOffer1');
    assert(listedSlugs.includes(activeOffer2.slug), 'Default active list includes activeOffer2');
    assert(!listedSlugs.includes(expiredOffer.slug), 'Default active list strictly EXCLUDES expired offers');

    // Filter by bike
    const bikeFilterRes = await makeRequest('GET', `/api/offers?bike=${testBike1._id}`);
    assert(bikeFilterRes.status === 200, 'GET /api/offers?bike=... returns HTTP 200');
    const bikeFilteredSlugs = bikeFilterRes.data.data.map((o) => o.slug);
    assert(bikeFilteredSlugs.includes(activeOffer1.slug), 'Bike filter returns matching bike offer');
    assert(!bikeFilteredSlugs.includes(activeOffer2.slug), 'Bike filter excludes non-matching bike offer');

    // Filter by showroom
    const showroomFilterRes = await makeRequest('GET', `/api/offers?showroom=${testShowroom._id}`);
    assert(showroomFilterRes.status === 200, 'GET /api/offers?showroom=... returns HTTP 200');
    const showroomSlugs = showroomFilterRes.data.data.map((o) => o.slug);
    assert(showroomSlugs.includes(activeOffer1.slug), 'Showroom filter returns matching showroom offer');
    assert(!showroomSlugs.includes(activeOffer2.slug), 'Showroom filter excludes different showroom offer');

    // Filter by offerType
    const typeFilterRes = await makeRequest('GET', `/api/offers?offerType=${OFFER_TYPES.EXCHANGE}`);
    assert(typeFilterRes.status === 200, 'GET /api/offers?offerType=exchange returns HTTP 200');
    const typeSlugs = typeFilterRes.data.data.map((o) => o.slug);
    assert(typeSlugs.includes(activeOffer2.slug), 'OfferType filter returns matching exchange offer');
    assert(!typeSlugs.includes(activeOffer1.slug), 'OfferType filter excludes discount offer');

    // Query active=all includes expired
    const allRes = await makeRequest('GET', `/api/offers?active=all&bike=${testBike1._id}`);
    assert(allRes.status === 200, 'GET /api/offers?active=all returns HTTP 200');
    const allSlugs = allRes.data.data.map((o) => o.slug);
    assert(allSlugs.includes(expiredOffer.slug), 'active=all includes expired offer');

    // Pagination verification
    const pagedRes = await makeRequest('GET', '/api/offers?limit=1&page=1');
    assert(pagedRes.status === 200, 'Pagination returns HTTP 200');
    assert(pagedRes.data.data.length === 1, 'Limit=1 returns exactly 1 item');
    assert(pagedRes.data.meta && pagedRes.data.meta.total >= 2, 'Meta contains total count');
    assert(pagedRes.data.meta.page === 1, 'Meta contains current page');

    // Sorting verification
    const sortedRes = await makeRequest('GET', '/api/offers?sort=discountHigh');
    assert(sortedRes.status === 200, 'Sorting by discountHigh returns HTTP 200');
    if (sortedRes.data.data.length >= 2) {
      assert(
        sortedRes.data.data[0].discountValue >= sortedRes.data.data[1].discountValue,
        'Offers sorted descending by discount value'
      );
    }

    // 7. Testing Offer Detail API (by ID and by Slug)
    console.log('\n7. Auditing Offer Detail GET /api/offers/:idOrSlug:');

    // By ID
    const detailByIdRes = await makeRequest('GET', `/api/offers/${activeOffer1._id}`);
    assert(detailByIdRes.status === 200, 'GET /api/offers/:id returns HTTP 200');
    assert(detailByIdRes.data.data.title === activeOffer1.title, 'Offer title matches by ID');
    assert(detailByIdRes.data.data.bike && detailByIdRes.data.data.bike.name, 'Offer bike relationship is populated');
    assert(detailByIdRes.data.data.__v === undefined, 'Internal __v field is omitted from detail response');

    // By Slug
    const detailBySlugRes = await makeRequest('GET', `/api/offers/${activeOffer1.slug}`);
    assert(detailBySlugRes.status === 200, 'GET /api/offers/:slug returns HTTP 200');
    assert(detailBySlugRes.data.data._id.toString() === activeOffer1._id.toString(), 'Offer ID matches by Slug');

    // Nonexistent Offer
    const notFoundRes = await makeRequest('GET', `/api/offers/${new mongoose.Types.ObjectId()}`);
    assert(notFoundRes.status === 404, 'Nonexistent offer ID returns HTTP 404');
    assert(notFoundRes.data.success === false, '404 response has success: false');

    // 8. Testing Unsafe / Injection Query Handling
    console.log('\n8. Auditing Security & Input Sanitization:');
    const injectionRes = await makeRequest('GET', '/api/offers?$where=sleep(100)');
    assert(injectionRes.status === 400, 'Operator injection in query string ($where) rejected with HTTP 400');

    const invalidObjectIdRes = await makeRequest('GET', '/api/offers?bike=invalid-object-id-123');
    assert(invalidObjectIdRes.status === 400, 'Invalid bike ObjectId in query rejected with HTTP 400');

    const invalidTypeRes = await makeRequest('GET', '/api/offers?offerType=unsupported-category');
    assert(invalidTypeRes.status === 400, 'Invalid offerType query rejected with HTTP 400');

    // 9. Clean up temporary test data
    console.log('\n9. Cleaning up temporary test fixtures:');
    await Offer.deleteMany({ bike: { $in: [testBike1._id, testBike2._id] } });
    await BikeVariant.deleteMany({ _id: { $in: [testVariant1._id, testVariant2._id] } });
    await Bike.deleteMany({ _id: { $in: [testBike1._id, testBike2._id] } });
    await Showroom.deleteOne({ _id: testShowroom._id });
    console.log('  Cleaned up temporary offer fixtures successfully.');

    // Print summary
    console.log('\n================================================================');
    console.log(` SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
    console.log('================================================================\n');

    if (server) server.close();
    await disconnectDatabase();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Offer backend tests:', err);
    if (server) server.close();
    await disconnectDatabase();
    process.exit(1);
  }
}

runOfferTests();
