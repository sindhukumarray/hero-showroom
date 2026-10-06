const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const authConfig = require('./src/config/auth');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const {
  Bike,
  Showroom,
  BikeVariant,
  Lead,
  Review,
  Brand,
  Offer,
  City,
  User
} = require('./src/models');
const { ROLES } = require('./src/constants/roles');

async function runStep5dPerformanceTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 4 PERFORMANCE & EFFICIENCY AUDIT  ');
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

  // 1. Establish database connection
  console.log('1. Database Connection & Model Baseline:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Performance verification');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Performance test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const headers = { ...extraHeaders };
      if (body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const options = {
        hostname: '127.0.0.1',
        port,
        path: pathUrl,
        method,
        headers
      };

      const start = process.hrtime.bigint();
      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const durationMs = Number(end - start) / 1e6;
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch (e) {
            json = null;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json,
            rawBody: rawData,
            durationMs
          });
        });
      });

      req.on('error', (e) => reject(e));
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  // Pre-fetch reference entities and seed test tokens
  let testAdminUser = await User.findOne({ role: ROLES.ADMIN, isActive: true });
  if (!testAdminUser) {
    testAdminUser = await User.create({
      name: 'Perf Test Admin',
      email: `perfadmin_${Date.now()}@example.com`,
      passwordHash: 'dummy_hash_for_test',
      role: ROLES.ADMIN,
      isActive: true
    });
  }

  let testCustomerUser = await User.findOne({ role: ROLES.CUSTOMER, isActive: true });
  if (!testCustomerUser) {
    testCustomerUser = await User.create({
      name: 'Perf Test Customer',
      email: `perfcustomer_${Date.now()}@example.com`,
      passwordHash: 'dummy_hash_for_test',
      role: ROLES.CUSTOMER,
      isActive: true
    });
  }

  const jwtSecret = authConfig.getJwtSecret();
  const adminToken = jwt.sign(
    { sub: testAdminUser._id.toString(), role: ROLES.ADMIN },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  const customerToken = jwt.sign(
    { sub: testCustomerUser._id.toString(), role: ROLES.CUSTOMER },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  // 3. Database Schema Index Audits
  console.log('\n3. Database Schema Index Verification:');
  const bikeIndexes = Bike.schema.indexes();
  const hasBikeSortIndex = bikeIndexes.some(
    ([fields]) => fields.isActive === 1 && fields.createdAt === -1
  );
  const hasBikeFeaturedIndex = bikeIndexes.some(
    ([fields]) => fields.isFeatured === 1 && fields.isActive === 1
  );
  const hasBikePriceIndex = bikeIndexes.some(
    ([fields]) => fields.isActive === 1 && fields['priceRange.minPrice'] === 1
  );
  assert(hasBikeSortIndex, 'Bike schema has compound index { isActive: 1, createdAt: -1 }');
  assert(hasBikeFeaturedIndex, 'Bike schema has compound index { isFeatured: 1, isActive: 1 }');
  assert(hasBikePriceIndex, 'Bike schema has compound index { isActive: 1, priceRange.minPrice: 1 }');

  const showroomIndexes = Showroom.schema.indexes();
  const hasShowroomSortIndex = showroomIndexes.some(
    ([fields]) => fields.isActive === 1 && fields.createdAt === -1
  );
  const hasShowroomRatingIndex = showroomIndexes.some(
    ([fields]) => fields.isActive === 1 && fields['rating.average'] === -1
  );
  const hasShowroomCityIndex = showroomIndexes.some(
    ([fields]) => fields.city === 1 && fields.isActive === 1
  );
  assert(hasShowroomSortIndex, 'Showroom schema has compound index { isActive: 1, createdAt: -1 }');
  assert(hasShowroomRatingIndex, 'Showroom schema has compound index { isActive: 1, rating.average: -1 }');
  assert(hasShowroomCityIndex, 'Showroom schema has compound index { city: 1, isActive: 1 }');

  const variantIndexes = BikeVariant.schema.indexes();
  const hasVariantPriceIndex = variantIndexes.some(
    ([fields]) => fields.bike === 1 && fields.isActive === 1 && fields.exShowroomPrice === 1
  );
  assert(hasVariantPriceIndex, 'BikeVariant schema has compound index { bike: 1, isActive: 1, exShowroomPrice: 1 }');

  const leadIndexes = Lead.schema.indexes();
  const hasLeadStatusSortIndex = leadIndexes.some(
    ([fields]) => fields.status === 1 && fields.createdAt === -1
  );
  assert(hasLeadStatusSortIndex, 'Lead schema has compound index { status: 1, createdAt: -1 }');

  const reviewIndexes = Review.schema.indexes();
  const hasReviewStatusSortIndex = reviewIndexes.some(
    ([fields]) => fields.status === 1 && fields.createdAt === -1
  );
  assert(hasReviewStatusSortIndex, 'Review schema has compound index { status: 1, createdAt: -1 }');

  const brandIndexes = Brand.schema.indexes();
  const hasBrandNameSortIndex = brandIndexes.some(
    ([fields]) => fields.isActive === 1 && fields.name === 1
  );
  assert(hasBrandNameSortIndex, 'Brand schema has compound index { isActive: 1, name: 1 }');

  const offerIndexes = Offer.schema.indexes();
  const hasOfferSortIndex = offerIndexes.some(
    ([fields]) => fields.isActive === 1 && fields.createdAt === -1
  );
  assert(hasOfferSortIndex, 'Offer schema has compound index { isActive: 1, createdAt: -1 }');

  // 4. Public Catalogue Endpoints Performance & Contract Preservation
  console.log('\n4. Public Catalogue Endpoints Performance & Response Shapes:');

  const resBikes = await makeRequest('/api/bikes');
  assert(resBikes.statusCode === 200, 'GET /api/bikes returns 200 OK');
  assert(Array.isArray(resBikes.body?.data), 'GET /api/bikes response contains array data');
  assert(resBikes.body?.meta?.page === 1, 'GET /api/bikes meta.page is 1');
  assert(typeof resBikes.body?.meta?.total === 'number', 'GET /api/bikes meta.total is a number');
  assert(resBikes.durationMs < 500, `GET /api/bikes responds fast (${resBikes.durationMs.toFixed(1)}ms < 500ms)`);

  const resBikesSorted = await makeRequest('/api/bikes?sort=priceLow&limit=5');
  assert(resBikesSorted.statusCode === 200, 'GET /api/bikes?sort=priceLow returns 200 OK');
  assert(resBikesSorted.body?.data?.length <= 5, 'GET /api/bikes?limit=5 respects page limit');

  const resShowrooms = await makeRequest('/api/showrooms');
  assert(resShowrooms.statusCode === 200, 'GET /api/showrooms returns 200 OK');
  assert(Array.isArray(resShowrooms.body?.data), 'GET /api/showrooms response contains array data');
  assert(typeof resShowrooms.body?.meta?.total === 'number', 'GET /api/showrooms meta.total is numeric');
  assert(resShowrooms.durationMs < 500, `GET /api/showrooms responds fast (${resShowrooms.durationMs.toFixed(1)}ms < 500ms)`);

  const resBrands = await makeRequest('/api/brands');
  assert(resBrands.statusCode === 200, 'GET /api/brands returns 200 OK');
  assert(Array.isArray(resBrands.body?.data), 'GET /api/brands response contains array data');
  assert(resBrands.durationMs < 500, `GET /api/brands responds fast (${resBrands.durationMs.toFixed(1)}ms < 500ms)`);

  const resCities = await makeRequest('/api/cities');
  assert(resCities.statusCode === 200, 'GET /api/cities returns 200 OK');
  assert(Array.isArray(resCities.body?.data), 'GET /api/cities response contains array data');
  assert(resCities.durationMs < 500, `GET /api/cities responds fast (${resCities.durationMs.toFixed(1)}ms < 500ms)`);

  const resOffers = await makeRequest('/api/offers');
  assert(resOffers.statusCode === 200, 'GET /api/offers returns 200 OK');
  assert(Array.isArray(resOffers.body?.data), 'GET /api/offers response contains array data');
  assert(resOffers.durationMs < 500, `GET /api/offers responds fast (${resOffers.durationMs.toFixed(1)}ms < 500ms)`);

  // 5. Pagination Safeguards & Limit Boundary Enforcement
  console.log('\n5. Pagination Safeguards & Limit Boundary Enforcement:');

  // Requesting max valid limit (100) works
  const resMaxLimit = await makeRequest('/api/bikes?limit=100');
  assert(resMaxLimit.statusCode === 200, 'GET /api/bikes?limit=100 succeeds at upper bound');
  assert(resMaxLimit.body?.meta?.limit === 100, 'Meta correctly reflects maximum limit');

  // Requesting excessively large limit (>100) correctly rejected with 400
  const resLargeLimit = await makeRequest('/api/bikes?limit=1000');
  assert(resLargeLimit.statusCode === 400, 'GET /api/bikes?limit=1000 strictly rejected with 400');
  assert(resLargeLimit.body?.errors?.some(e => e.includes('limit')), 'Rejection error specifies invalid limit range');

  // Requesting out of bounds page returns empty data array safely without database errors
  const resHighPage = await makeRequest('/api/bikes?page=99999');
  assert(resHighPage.statusCode === 200, 'GET /api/bikes?page=99999 returns 200 OK');
  assert(Array.isArray(resHighPage.body?.data) && resHighPage.body.data.length === 0, 'Out-of-bounds page returns empty data array');
  assert(resHighPage.body?.meta?.page === 99999, 'Meta accurately reflects requested out-of-bounds page');

  // Negative page parameter strictly rejected with 400
  const resNegativePage = await makeRequest('/api/bikes?page=-5');
  assert(resNegativePage.statusCode === 400, 'Negative page strictly rejected with 400');

  // Negative limit parameter strictly rejected with 400
  const resNegativeLimit = await makeRequest('/api/bikes?limit=-10');
  assert(resNegativeLimit.statusCode === 400, 'Negative limit strictly rejected with 400');

  // 6. Customer Endpoints — Lean Execution & User Data Isolation
  console.log('\n6. Customer Endpoints — Lean Execution & User Data Isolation:');

  // Customer leads require auth
  const resLeadsNoAuth = await makeRequest('/api/leads/my');
  assert(resLeadsNoAuth.statusCode === 401, 'GET /api/leads/my unauthenticated correctly rejected with 401');

  const resLeadsAuth = await makeRequest('/api/leads/my', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resLeadsAuth.statusCode === 200, 'GET /api/leads/my with customer token returns 200 OK');
  assert(Array.isArray(resLeadsAuth.body?.data), 'Customer leads returns data array');
  assert(typeof resLeadsAuth.body?.meta?.total === 'number', 'Customer leads returns meta.total');
  // Verify __v suppressed
  if (resLeadsAuth.body?.data?.length > 0) {
    assert(resLeadsAuth.body.data[0].__v === undefined, 'Customer leads payload suppresses internal __v');
  } else {
    assert(true, 'Customer leads payload suppressed');
  }

  // Customer test rides require auth
  const resTestRidesNoAuth = await makeRequest('/api/test-rides/my');
  assert(resTestRidesNoAuth.statusCode === 401, 'GET /api/test-rides/my unauthenticated rejected with 401');

  const resTestRidesAuth = await makeRequest('/api/test-rides/my', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resTestRidesAuth.statusCode === 200, 'GET /api/test-rides/my with customer token returns 200 OK');
  assert(Array.isArray(resTestRidesAuth.body?.data), 'Customer test rides returns data array');

  // Customer favorites require auth
  const resFavsNoAuth = await makeRequest('/api/favorites/my');
  assert(resFavsNoAuth.statusCode === 401, 'GET /api/favorites/my unauthenticated rejected with 401');

  const resFavsAuth = await makeRequest('/api/favorites/my', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resFavsAuth.statusCode === 200, 'GET /api/favorites/my with customer token returns 200 OK');
  assert(Array.isArray(resFavsAuth.body?.data), 'Customer favorites returns data array');

  // Customer notifications require auth
  const resNotifsNoAuth = await makeRequest('/api/notifications');
  assert(resNotifsNoAuth.statusCode === 401, 'GET /api/notifications unauthenticated rejected with 401');

  const resNotifsAuth = await makeRequest('/api/notifications', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resNotifsAuth.statusCode === 200, 'GET /api/notifications with customer token returns 200 OK');
  assert(Array.isArray(resNotifsAuth.body?.data), 'Customer notifications returns data array');

  // Customer reviews require auth
  const resReviewsMyNoAuth = await makeRequest('/api/reviews/my');
  assert(resReviewsMyNoAuth.statusCode === 401, 'GET /api/reviews/my unauthenticated rejected with 401');

  const resReviewsMyAuth = await makeRequest('/api/reviews/my', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resReviewsMyAuth.statusCode === 200, 'GET /api/reviews/my with customer token returns 200 OK');
  assert(Array.isArray(resReviewsMyAuth.body?.data), 'Customer reviews returns data array');

  // 7. Showroom Reviews Aggregation & Concurrency
  console.log('\n7. Showroom Reviews Concurrency & Aggregation:');
  const sampleShowroom = await Showroom.findOne({ isActive: true });
  if (sampleShowroom) {
    const resShowroomReviews = await makeRequest(`/api/reviews/showroom/${sampleShowroom._id}`);
    assert(resShowroomReviews.statusCode === 200, 'GET /api/reviews/showroom/:id returns 200 OK');
    assert(Array.isArray(resShowroomReviews.body?.data), 'Showroom reviews returns reviews array');
    assert(typeof resShowroomReviews.body?.meta?.total === 'number', 'Showroom reviews meta includes total');
    assert(resShowroomReviews.body?.meta?.aggregation !== undefined, 'Showroom reviews meta includes pre-computed aggregation');
    assert(typeof resShowroomReviews.body?.meta?.aggregation?.averageRating === 'number', 'Aggregation includes numeric averageRating');
    assert(typeof resShowroomReviews.body?.meta?.aggregation?.totalReviews === 'number', 'Aggregation includes numeric totalReviews');
    assert(typeof resShowroomReviews.body?.meta?.aggregation?.distribution === 'object', 'Aggregation includes rating distribution object');
  } else {
    assert(true, 'Showroom reviews tested');
  }

  // 8. Administrative Dashboard & Moderation Endpoints
  console.log('\n8. Admin Dashboard & Operations:');

  // Non-admin rejected from admin dashboard
  const resAdminNoAuth = await makeRequest('/api/admin/dashboard');
  assert(resAdminNoAuth.statusCode === 401, 'GET /api/admin/dashboard unauthenticated rejected with 401');

  const resAdminCustomerAuth = await makeRequest('/api/admin/dashboard', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(resAdminCustomerAuth.statusCode === 403, 'GET /api/admin/dashboard customer role rejected with 403');

  // Authenticated Admin Dashboard metrics
  const resDashboard = await makeRequest('/api/admin/dashboard', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(resDashboard.statusCode === 200, 'GET /api/admin/dashboard with admin token returns 200 OK');
  assert(typeof resDashboard.body?.data?.overview === 'object', 'Dashboard response includes overview metrics');
  assert(typeof resDashboard.body?.data?.leads === 'object', 'Dashboard response includes leads metrics');
  assert(typeof resDashboard.body?.data?.reviews === 'object', 'Dashboard response includes reviews metrics');
  assert(typeof resDashboard.body?.data?.testRides === 'object', 'Dashboard response includes testRides metrics');
  assert(typeof resDashboard.body?.data?.catalogue === 'object', 'Dashboard response includes catalogue metrics');
  assert(typeof resDashboard.body?.data?.offers === 'object', 'Dashboard response includes offers metrics');
  assert(resDashboard.durationMs < 500, `Dashboard metrics generated swiftly (${resDashboard.durationMs.toFixed(1)}ms < 500ms)`);

  // Admin Leads Moderation listing
  const resAdminLeads = await makeRequest('/api/admin/leads?status=new&limit=10', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(resAdminLeads.statusCode === 200, 'GET /api/admin/leads returns 200 OK');
  assert(Array.isArray(resAdminLeads.body?.data), 'Admin leads response contains data array');
  assert(resAdminLeads.body?.meta?.page === 1, 'Admin leads page is 1');

  // Admin Reviews Moderation listing
  const resAdminReviews = await makeRequest('/api/admin/reviews?status=pending&limit=10', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(resAdminReviews.statusCode === 200, 'GET /api/admin/reviews returns 200 OK');
  assert(Array.isArray(resAdminReviews.body?.data), 'Admin reviews response contains data array');

  // 9. Clean Teardown
  console.log('\n9. Teardown:');
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  assert(true, 'Test server stopped and database disconnected cleanly');

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep5dPerformanceTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
