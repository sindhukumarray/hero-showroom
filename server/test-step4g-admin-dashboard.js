const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const {
  User,
  Brand,
  City,
  Showroom,
  Bike,
  BikeVariant,
  Lead,
  Review,
  TestRide,
  Offer
} = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const { LEAD_STATUS } = require('./src/constants/leads');
const { REVIEW_STATUS } = require('./src/constants/reviews');
const { TEST_RIDE_STATUS } = require('./src/constants/testRides');
const authConfig = require('./src/config/auth');

async function runStep4gTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 7 ADMIN DASHBOARD TEST SUITE      ');
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
  console.log('1. Connecting to Database:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Admin Dashboard testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Live test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      const postData = body !== null ? JSON.stringify(body) : '';
      const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders
      };
      if (body !== null) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }
      const req = http.request(
        {
          host: '127.0.0.1',
          port: port,
          path: pathUrl,
          method: method,
          headers
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(resData) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: resData });
            }
          });
        }
      );
      req.on('error', reject);
      if (body !== null) {
        req.write(postData);
      }
      req.end();
    });
  };

  const testPrefix = `test-dash-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminPass123!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  const createdUserIds = [];
  const createdLeadIds = [];
  const createdReviewIds = [];
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdShowroomIds = [];
  const createdBikeIds = [];

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const secret = authConfig.getJwtSecret();

    // Create test customer (using er_sindhu as specified in project rules)
    customerUser = await User.create({
      name: 'er_sindhu',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43210',
      role: ROLES.CUSTOMER,
      isActive: true
    });
    createdUserIds.push(customerUser._id);

    customerToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Create test admin user
    adminUser = await User.create({
      name: 'er_sindhu Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43299',
      role: ROLES.ADMIN,
      isActive: true
    });
    createdUserIds.push(adminUser._id);

    adminToken = jwt.sign(
      { sub: adminUser._id.toString(), role: adminUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    console.log('\n3. Authentication & RBAC Access Security:');
    // Test 3: Unauthenticated access to /api/admin/dashboard
    const unauthRes = await makeRequest('/api/admin/dashboard', 'GET');
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/admin/dashboard rejected with 401');
    assert(unauthRes.data?.success === false, 'Unauthenticated rejection payload contains success: false');

    // Test 4: Customer non-admin access to /api/admin/dashboard
    const custRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(custRes.status === 403, 'Non-admin customer request to /api/admin/dashboard rejected with 403');
    assert(custRes.data?.success === false, 'Non-admin rejection payload contains success: false');

    // Test 5: Admin authorized access
    console.log('\n4. Admin Authorized Access & Response Structure:');
    const adminRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminRes.status === 200, 'Admin authorized GET /api/admin/dashboard returns 200 OK');
    assert(adminRes.data?.success === true, 'Response payload contains success: true');
    assert(typeof adminRes.data?.data === 'object', 'Response contains data object');

    const data = adminRes.data?.data || {};

    // Test 6: Verify top-level structure sections
    assert(typeof data.overview === 'object' && data.overview !== null, 'Payload contains overview section');
    assert(typeof data.leads === 'object' && data.leads !== null, 'Payload contains leads section');
    assert(typeof data.reviews === 'object' && data.reviews !== null, 'Payload contains reviews section');
    assert(typeof data.testRides === 'object' && data.testRides !== null, 'Payload contains testRides section');
    assert(typeof data.catalogue === 'object' && data.catalogue !== null, 'Payload contains catalogue section');
    assert(typeof data.offers === 'object' && data.offers !== null, 'Payload contains offers section');

    // Test 7: Overview counts validation
    console.log('\n5. Overview Counts Validation:');
    const overview = data.overview;
    assert(typeof overview.totalUsers === 'number' && overview.totalUsers >= 2, `totalUsers is valid number >= 2 (${overview.totalUsers})`);
    assert(typeof overview.totalLeads === 'number' && overview.totalLeads >= 0, `totalLeads is non-negative number (${overview.totalLeads})`);
    assert(typeof overview.totalTestRides === 'number' && overview.totalTestRides >= 0, `totalTestRides is non-negative number (${overview.totalTestRides})`);
    assert(typeof overview.totalReviews === 'number' && overview.totalReviews >= 0, `totalReviews is non-negative number (${overview.totalReviews})`);
    assert(typeof overview.totalShowrooms === 'number' && overview.totalShowrooms >= 0, `totalShowrooms is non-negative number (${overview.totalShowrooms})`);
    assert(typeof overview.totalBikes === 'number' && overview.totalBikes >= 0, `totalBikes is non-negative number (${overview.totalBikes})`);
    assert(typeof overview.totalOffers === 'number' && overview.totalOffers >= 0, `totalOffers is non-negative number (${overview.totalOffers})`);

    // Test 8: Lead status counts validation
    console.log('\n6. Lead Status Funnel Metrics:');
    const leads = data.leads;
    assert(typeof leads.total === 'number' && leads.total >= 0, `leads.total is valid non-negative integer (${leads.total})`);
    assert(typeof leads.new === 'number' && leads.new >= 0, `leads.new is non-negative integer (${leads.new})`);
    assert(typeof leads.contacted === 'number' && leads.contacted >= 0, `leads.contacted is non-negative integer (${leads.contacted})`);
    assert(typeof leads.qualified === 'number' && leads.qualified >= 0, `leads.qualified is non-negative integer (${leads.qualified})`);
    assert(typeof leads.converted === 'number' && leads.converted >= 0, `leads.converted is non-negative integer (${leads.converted})`);
    assert(typeof leads.closed === 'number' && leads.closed >= 0, `leads.closed is non-negative integer (${leads.closed})`);

    const sumLeadStatuses = leads.new + leads.contacted + leads.qualified + leads.converted + leads.closed;
    assert(sumLeadStatuses === leads.total, `Sum of lead statuses (${sumLeadStatuses}) matches leads.total (${leads.total})`);
    assert(leads.total === overview.totalLeads, `leads.total (${leads.total}) matches overview.totalLeads (${overview.totalLeads})`);

    // Test 9: Review metrics validation
    console.log('\n7. Review Moderation Metrics:');
    const reviews = data.reviews;
    assert(typeof reviews.total === 'number' && reviews.total >= 0, `reviews.total is non-negative integer (${reviews.total})`);
    assert(typeof reviews.pending === 'number' && reviews.pending >= 0, `reviews.pending is non-negative integer (${reviews.pending})`);
    assert(typeof reviews.approved === 'number' && reviews.approved >= 0, `reviews.approved is non-negative integer (${reviews.approved})`);
    assert(typeof reviews.rejected === 'number' && reviews.rejected >= 0, `reviews.rejected is non-negative integer (${reviews.rejected})`);
    assert(typeof reviews.averageRating === 'number' && reviews.averageRating >= 0 && reviews.averageRating <= 5, `reviews.averageRating is between 0 and 5 (${reviews.averageRating})`);

    const sumReviewStatuses = reviews.pending + reviews.approved + reviews.rejected;
    assert(sumReviewStatuses === reviews.total, `Sum of review moderation statuses (${sumReviewStatuses}) matches reviews.total (${reviews.total})`);
    assert(reviews.total === overview.totalReviews, `reviews.total (${reviews.total}) matches overview.totalReviews (${overview.totalReviews})`);

    // Test 10: Catalogue metrics validation
    console.log('\n8. Catalogue Health Metrics:');
    const catalogue = data.catalogue;
    assert(typeof catalogue.totalBrands === 'number' && catalogue.activeBrands <= catalogue.totalBrands, `activeBrands (${catalogue.activeBrands}) <= totalBrands (${catalogue.totalBrands})`);
    assert(typeof catalogue.totalCities === 'number' && catalogue.activeCities <= catalogue.totalCities, `activeCities (${catalogue.activeCities}) <= totalCities (${catalogue.totalCities})`);
    assert(typeof catalogue.totalShowrooms === 'number' && catalogue.activeShowrooms <= catalogue.totalShowrooms, `activeShowrooms (${catalogue.activeShowrooms}) <= totalShowrooms (${catalogue.totalShowrooms})`);
    assert(catalogue.totalShowrooms === overview.totalShowrooms, `catalogue.totalShowrooms (${catalogue.totalShowrooms}) matches overview.totalShowrooms (${overview.totalShowrooms})`);
    assert(typeof catalogue.totalBikes === 'number' && catalogue.activeBikes <= catalogue.totalBikes, `activeBikes (${catalogue.activeBikes}) <= totalBikes (${catalogue.totalBikes})`);
    assert(catalogue.totalBikes === overview.totalBikes, `catalogue.totalBikes (${catalogue.totalBikes}) matches overview.totalBikes (${overview.totalBikes})`);
    assert(typeof catalogue.featuredBikes === 'number' && catalogue.featuredBikes <= catalogue.totalBikes, `featuredBikes (${catalogue.featuredBikes}) <= totalBikes (${catalogue.totalBikes})`);
    assert(typeof catalogue.totalVariants === 'number' && catalogue.activeVariants <= catalogue.totalVariants, `activeVariants (${catalogue.activeVariants}) <= totalVariants (${catalogue.totalVariants})`);

    // Test 11: Test Ride metrics validation
    console.log('\n9. Test Ride Appointment Metrics:');
    const testRides = data.testRides;
    assert(typeof testRides.total === 'number' && testRides.total >= 0, `testRides.total is non-negative integer (${testRides.total})`);
    assert(typeof testRides.requested === 'number' && testRides.requested >= 0, `testRides.requested is non-negative integer (${testRides.requested})`);
    assert(typeof testRides.confirmed === 'number' && testRides.confirmed >= 0, `testRides.confirmed is non-negative integer (${testRides.confirmed})`);
    assert(typeof testRides.completed === 'number' && testRides.completed >= 0, `testRides.completed is non-negative integer (${testRides.completed})`);
    assert(typeof testRides.cancelled === 'number' && testRides.cancelled >= 0, `testRides.cancelled is non-negative integer (${testRides.cancelled})`);

    const sumRideStatuses = testRides.requested + testRides.confirmed + testRides.completed + testRides.cancelled;
    assert(sumRideStatuses === testRides.total, `Sum of test ride statuses (${sumRideStatuses}) matches testRides.total (${testRides.total})`);
    assert(testRides.total === overview.totalTestRides, `testRides.total (${testRides.total}) matches overview.totalTestRides (${overview.totalTestRides})`);

    // Test 12: Offer metrics validation
    console.log('\n10. Promotion & Offer Metrics:');
    const offers = data.offers;
    assert(typeof offers.total === 'number' && offers.total >= 0, `offers.total is non-negative integer (${offers.total})`);
    assert(typeof offers.active === 'number' && offers.active >= 0, `offers.active is non-negative integer (${offers.active})`);
    assert(offers.active <= offers.total, `offers.active (${offers.active}) <= offers.total (${offers.total})`);
    assert(offers.total === overview.totalOffers, `offers.total (${offers.total}) matches overview.totalOffers (${overview.totalOffers})`);

    // Test 13: Controlled Temporary Data Lifecycle Test
    console.log('\n11. Dynamic Data Increment & Decrement Validation:');
    // Create temporary brand, city, showroom, and bike for foreign keys
    const tempBrand = await Brand.create({
      name: `${testPrefix} Brand`,
      slug: `${testPrefix}-brand`,
      originCountry: 'India',
      isActive: true
    });
    createdBrandIds.push(tempBrand._id);

    const tempCity = await City.create({
      name: `${testPrefix} City`,
      slug: `${testPrefix}-city`,
      state: 'Karnataka',
      tier: 'Metro',
      isActive: true
    });
    createdCityIds.push(tempCity._id);

    const tempShowroom = await Showroom.create({
      name: `${testPrefix} Showroom`,
      slug: `${testPrefix}-showroom`,
      brand: tempBrand._id,
      city: tempCity._id,
      address: { fullAddress: '123 Test Street' },
      contact: { phone: '+91 98765 00000' },
      isActive: true
    });
    createdShowroomIds.push(tempShowroom._id);

    const tempBike = await Bike.create({
      brand: tempBrand._id,
      name: `${testPrefix} Motorcycle`,
      slug: `${testPrefix}-bike`,
      category: 'Commuter',
      priceRange: { minPrice: 75000, maxPrice: 95000 },
      isActive: true
    });
    createdBikeIds.push(tempBike._id);

    // Create temporary lead
    const tempLead = await Lead.create({
      user: customerUser._id,
      name: 'er_sindhu Lead',
      email: customerEmail.toLowerCase(),
      phone: '+91 98765 43210',
      showroom: tempShowroom._id,
      bike: tempBike._id,
      status: LEAD_STATUS.NEW,
      source: 'showroom'
    });
    createdLeadIds.push(tempLead._id);

    // Create temporary approved review
    const tempReview = await Review.create({
      user: customerUser._id,
      showroom: tempShowroom._id,
      rating: 5,
      comment: 'Excellent service and great test ride experience at Hero showroom.',
      status: REVIEW_STATUS.APPROVED
    });
    createdReviewIds.push(tempReview._id);

    // Query dashboard again
    const incrementRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    const incData = incrementRes.data?.data || {};

    assert(incData.leads?.new === leads.new + 1, `leads.new accurately incremented by 1 (${leads.new} -> ${incData.leads?.new})`);
    assert(incData.leads?.total === leads.total + 1, `leads.total accurately incremented by 1 (${leads.total} -> ${incData.leads?.total})`);
    assert(incData.reviews?.approved === reviews.approved + 1, `reviews.approved accurately incremented by 1 (${reviews.approved} -> ${incData.reviews?.approved})`);
    assert(incData.reviews?.total === reviews.total + 1, `reviews.total accurately incremented by 1 (${reviews.total} -> ${incData.reviews?.total})`);

    // Clean up temporary lead and review
    await Lead.findByIdAndDelete(tempLead._id);
    await Review.findByIdAndDelete(tempReview._id);

    // Query dashboard again to confirm decrement
    const decrementRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    const decData = decrementRes.data?.data || {};

    assert(decData.leads?.new === leads.new, `leads.new accurately restored to ${leads.new}`);
    assert(decData.leads?.total === leads.total, `leads.total accurately restored to ${leads.total}`);
    assert(decData.reviews?.approved === reviews.approved, `reviews.approved accurately restored to ${reviews.approved}`);

    // Test 14: Sensitive Data Protection
    console.log('\n12. Sensitive Data & Security Verification:');
    const payloadStr = JSON.stringify(adminRes.data);
    assert(!payloadStr.includes('passwordHash'), 'Dashboard payload contains no passwordHash');
    assert(!payloadStr.includes('password'), 'Dashboard payload contains no raw passwords');
    assert(!payloadStr.includes('resetToken'), 'Dashboard payload contains no reset tokens');
    assert(!payloadStr.includes('refreshToken'), 'Dashboard payload contains no refresh tokens');

    // Test 15: Concurrency Safety & Query Performance
    console.log('\n13. Query Performance & Concurrency Testing:');
    const startTime = Date.now();
    const concurrentRequests = await Promise.all([
      makeRequest('/api/admin/dashboard', 'GET', null, { Authorization: `Bearer ${adminToken}` }),
      makeRequest('/api/admin/dashboard', 'GET', null, { Authorization: `Bearer ${adminToken}` }),
      makeRequest('/api/admin/dashboard', 'GET', null, { Authorization: `Bearer ${adminToken}` }),
      makeRequest('/api/admin/dashboard', 'GET', null, { Authorization: `Bearer ${adminToken}` }),
      makeRequest('/api/admin/dashboard', 'GET', null, { Authorization: `Bearer ${adminToken}` })
    ]);
    const duration = Date.now() - startTime;
    const allSuccessful = concurrentRequests.every((r) => r.status === 200 && r.data?.success === true);
    assert(allSuccessful, '5 concurrent dashboard requests all returned 200 OK');
    assert(duration < 2000, `Concurrent requests completed within performance SLA (${duration}ms < 2000ms)`);

    // Test 16: Existing Admin Status Endpoint Regression
    console.log('\n14. Admin Status Endpoint Regression:');
    const statusRes = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(statusRes.status === 200, 'GET /api/admin/status returns 200 OK');
    assert(statusRes.data?.data?.verified === true, 'Admin status returns verified: true');
    assert(statusRes.data?.data?.system === 'Hero Showroom Administrative Engine', 'Admin status retains system engine signature');
    assert(statusRes.data?.data?.admin?.role === ROLES.ADMIN, 'Admin status reflects caller role: admin');

    const unauthStatus = await makeRequest('/api/admin/status', 'GET');
    assert(unauthStatus.status === 401, 'Unauthenticated GET /api/admin/status returns 401');

    const custStatus = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(custStatus.status === 403, 'Customer GET /api/admin/status returns 403');

  } catch (error) {
    console.error('Test execution encountered unexpected error:', error);
    assert(false, `Unexpected error during test execution: ${error.message}`);
  } finally {
    // 17. Test data cleanup
    console.log('\n15. Test Data Teardown:');
    try {
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
        console.log(`  Cleaned up ${createdUserIds.length} test users`);
      }
      if (createdBrandIds.length > 0) {
        await Brand.deleteMany({ _id: { $in: createdBrandIds } });
        console.log(`  Cleaned up ${createdBrandIds.length} test brands`);
      }
      if (createdCityIds.length > 0) {
        await City.deleteMany({ _id: { $in: createdCityIds } });
        console.log(`  Cleaned up ${createdCityIds.length} test cities`);
      }
      if (createdShowroomIds.length > 0) {
        await Showroom.deleteMany({ _id: { $in: createdShowroomIds } });
        console.log(`  Cleaned up ${createdShowroomIds.length} test showrooms`);
      }
      if (createdBikeIds.length > 0) {
        await Bike.deleteMany({ _id: { $in: createdBikeIds } });
        console.log(`  Cleaned up ${createdBikeIds.length} test bikes`);
      }
      assert(true, 'Test data teardown completed successfully');
    } catch (cleanupErr) {
      console.error('Failed to cleanup test data:', cleanupErr);
    }

    // Close server and database connection
    server.close();
    await disconnectDatabase();
    console.log('  Closed ephemeral server & disconnected database.');
  }

  console.log('\n================================================================');
  console.log(` PHASE 4 STEP 7 RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep4gTests();
