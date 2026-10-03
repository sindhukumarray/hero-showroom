const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Brand, City, Showroom, Review, Notification } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const { REVIEW_STATUS } = require('./src/constants/reviews');
const authConfig = require('./src/config/auth');

async function runStep4fTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 6 ADMIN REVIEWS TEST SUITE        ');
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
    assert(isConnected(), 'Database connected successfully for Admin Reviews testing');
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

  const testPrefix = `test-rev-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminPass123!';

  let customerUser, adminUser, secondCustomer;
  let customerToken, adminToken, secondCustomerToken;

  // Track created entities for thorough cleanup
  const createdUserIds = [];
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdShowroomIds = [];
  const createdReviewIds = [];

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

    // Create second customer for multiple reviews
    secondCustomer = await User.create({
      name: 'er_sindhu Second',
      email: `${testPrefix}-cust2@heroshowroom.example.com`.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43222',
      role: ROLES.CUSTOMER,
      isActive: true
    });
    createdUserIds.push(secondCustomer._id);

    secondCustomerToken = jwt.sign(
      { sub: secondCustomer._id.toString(), role: secondCustomer.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Create test admin
    adminUser = await User.create({
      name: 'er_sindhu Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43211',
      role: ROLES.ADMIN,
      isActive: true
    });
    createdUserIds.push(adminUser._id);

    adminToken = jwt.sign(
      { sub: adminUser._id.toString(), role: adminUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Seed test brand
    const testBrand = await Brand.create({
      name: `${testPrefix} Hero Brand`,
      slug: `${testPrefix}-hero-brand`,
      originCountry: 'India',
      isActive: true
    });
    createdBrandIds.push(testBrand._id);

    // Seed test city
    const testCity = await City.create({
      name: `${testPrefix} City`,
      slug: `${testPrefix}-city`,
      state: 'Karnataka',
      isActive: true
    });
    createdCityIds.push(testCity._id);

    // Seed test showroom
    const testShowroom = await Showroom.create({
      name: `${testPrefix} Flagship Worli`,
      slug: `${testPrefix}-flagship-worli`,
      brand: testBrand._id,
      city: testCity._id,
      dealerName: 'Apex Hero Dealership',
      showroomType: 'Premia Flagship',
      address: {
        fullAddress: '100 Feet Road, Indiranagar',
        street: '100 Feet Road',
        area: 'Indiranagar',
        pincode: '560038'
      },
      contact: {
        phone: '+91 98765 43212',
        email: 'worli@heromotors.example.com'
      },
      isActive: true
    });
    createdShowroomIds.push(testShowroom._id);

    // Seed second showroom for isolation
    const testShowroom2 = await Showroom.create({
      name: `${testPrefix} Suburb Dealership`,
      slug: `${testPrefix}-suburb-dealership`,
      brand: testBrand._id,
      city: testCity._id,
      dealerName: 'Apex Hero Suburb',
      showroomType: 'Standard Dealership',
      address: {
        fullAddress: 'Outer Ring Road, Marathahalli',
        street: 'Outer Ring Road',
        area: 'Marathahalli',
        pincode: '560037'
      },
      contact: {
        phone: '+91 98765 43213',
        email: 'suburb@heromotors.example.com'
      },
      isActive: true
    });
    createdShowroomIds.push(testShowroom2._id);

    // Seed diverse reviews
    // Review 1: pending, 5 stars
    const review1 = await Review.create({
      user: customerUser._id,
      showroom: testShowroom._id,
      rating: 5,
      title: `${testPrefix} Outstanding Premium Experience`,
      comment: 'The test ride and customer briefing was top notch. Absolutely loved the Premia lounge.',
      status: REVIEW_STATUS.PENDING,
      moderationNote: ''
    });
    createdReviewIds.push(review1._id);

    // Review 2: approved, 4 stars
    const review2 = await Review.create({
      user: secondCustomer._id,
      showroom: testShowroom._id,
      rating: 4,
      title: `${testPrefix} Good Service Response`,
      comment: 'Delivery was on time and documentation was processed efficiently.',
      status: REVIEW_STATUS.APPROVED,
      moderationNote: 'Verified genuine buyer.'
    });
    createdReviewIds.push(review2._id);

    // Review 3: rejected, 1 star
    const review3 = await Review.create({
      user: secondCustomer._id,
      showroom: testShowroom2._id,
      rating: 1,
      title: `${testPrefix} Delay in Quotation`,
      comment: 'Staff was unavailable during peak showroom hours.',
      status: REVIEW_STATUS.REJECTED,
      moderationNote: 'Disputed customer complaint.'
    });
    createdReviewIds.push(review3._id);

    console.log(`  Seeded 3 test reviews for ${testPrefix}`);

    // ================================================================
    // Test 1: Admin Authentication
    // ================================================================
    console.log('\n3. Test 1: Admin Authentication');
    const authRes = await makeRequest('/api/admin/reviews', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(authRes.status === 200, `Admin authenticated successfully (status 200, got ${authRes.status})`);
    assert(authRes.data && authRes.data.success === true, 'Response contains success=true');
    assert(Array.isArray(authRes.data.data), 'Response data is an array of reviews');
    assert(Boolean(authRes.data.meta), 'Response contains pagination metadata');

    // ================================================================
    // Test 2: Unauthenticated Rejection
    // ================================================================
    console.log('\n4. Test 2: Unauthenticated Rejection');
    const unauthRes = await makeRequest('/api/admin/reviews', 'GET');
    assert(unauthRes.status === 401, `Unauthenticated request rejected with 401 (got ${unauthRes.status})`);

    // ================================================================
    // Test 3: Non-Admin Rejection (RBAC)
    // ================================================================
    console.log('\n5. Test 3: Non-Admin Rejection');
    const customerRes = await makeRequest('/api/admin/reviews', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerRes.status === 403, `Customer token rejected with 403 Forbidden (got ${customerRes.status})`);

    // ================================================================
    // Test 4: GET Admin Reviews (List & Structure)
    // ================================================================
    console.log('\n6. Test 4: GET Admin Reviews (List & Structure)');
    const listRes = await makeRequest(`/api/admin/reviews?showroom=${testShowroom._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(listRes.status === 200, 'GET /api/admin/reviews returns 200');
    assert(listRes.data.data.length >= 2, `Returns at least 2 seeded reviews for testShowroom (found ${listRes.data.data.length})`);
    assert(listRes.data.meta.total >= 2, `Meta total matches count (total: ${listRes.data.meta.total})`);

    // ================================================================
    // Test 5: Search Filter
    // ================================================================
    console.log('\n7. Test 5: Search Filter');
    const searchRes = await makeRequest(
      `/api/admin/reviews?search=${encodeURIComponent('Outstanding Premium')}`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(searchRes.status === 200, 'Search request returns 200');
    const foundRev1 = searchRes.data.data.some((r) => r.title.includes('Outstanding Premium Experience'));
    const foundRev2 = searchRes.data.data.some((r) => r.title.includes('Good Service Response'));
    assert(foundRev1, "Search 'Outstanding Premium' matched review 1");
    assert(!foundRev2, "Search 'Outstanding Premium' excluded review 2");

    // Search by customer name
    const searchUserRes = await makeRequest(
      `/api/admin/reviews?search=${encodeURIComponent('er_sindhu Second')}`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(searchUserRes.status === 200, "Search by reviewer customer name returns 200");
    const matchedCustomerName = searchUserRes.data.data.some((r) => r._id === review2._id.toString());
    assert(matchedCustomerName, 'Found reviews written by user matching name search');

    // ================================================================
    // Test 6: Rating Filter
    // ================================================================
    console.log('\n8. Test 6: Rating Filter');
    const ratingRes = await makeRequest(
      `/api/admin/reviews?showroom=${testShowroom._id}&rating=5`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(ratingRes.status === 200, "Filter by rating=5 returns 200");
    const allRating5 = ratingRes.data.data.every((r) => r.rating === 5);
    assert(allRating5 && ratingRes.data.data.length > 0, 'All returned reviews have rating 5');

    // ================================================================
    // Test 7: Status / Moderation Filter
    // ================================================================
    console.log('\n9. Test 7: Status / Moderation Filter');
    const statusPendingRes = await makeRequest(
      `/api/admin/reviews?showroom=${testShowroom._id}&status=pending`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(statusPendingRes.status === 200, "Filter by status='pending' returns 200");
    const allPending = statusPendingRes.data.data.every((r) => r.status === 'pending');
    assert(allPending && statusPendingRes.data.data.length > 0, 'All returned reviews have status=pending');

    const statusApprovedRes = await makeRequest(
      `/api/admin/reviews?showroom=${testShowroom._id}&status=approved`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(statusApprovedRes.status === 200, "Filter by status='approved' returns 200");
    const allApproved = statusApprovedRes.data.data.every((r) => r.status === 'approved');
    assert(allApproved && statusApprovedRes.data.data.length > 0, 'All returned reviews have status=approved');

    // ================================================================
    // Test 8: Pagination
    // ================================================================
    console.log('\n10. Test 8: Pagination');
    const pageRes = await makeRequest(
      `/api/admin/reviews?showroom=${testShowroom._id}&page=1&limit=1`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(pageRes.status === 200, 'Pagination page=1&limit=1 returns 200');
    assert(pageRes.data.data.length === 1, `Returns exactly 1 item for limit=1 (got ${pageRes.data.data.length})`);
    assert(pageRes.data.meta.page === 1, 'Meta indicates page=1');
    assert(pageRes.data.meta.limit === 1, 'Meta indicates limit=1');
    assert(pageRes.data.meta.pages >= 2, `Total pages >= 2 for 2 items with limit=1 (pages: ${pageRes.data.meta.pages})`);

    // ================================================================
    // Test 9: Sorting Whitelist
    // ================================================================
    console.log('\n11. Test 9: Sorting Whitelist');
    const sortRatingRes = await makeRequest(
      `/api/admin/reviews?sort=rating_high`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(sortRatingRes.status === 200, "Valid sort 'rating_high' returns 200");

    const sortOldestRes = await makeRequest(
      `/api/admin/reviews?sort=oldest`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(sortOldestRes.status === 200, "Valid sort 'oldest' returns 200");

    const invalidSortRes = await makeRequest(
      `/api/admin/reviews?sort=unauthorized_column`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(invalidSortRes.status === 400, `Invalid sort rejected with 400 (got ${invalidSortRes.status})`);
    assert(
      invalidSortRes.data && invalidSortRes.data.errors && invalidSortRes.data.errors.length > 0,
      'Invalid sort returns explicit validation errors'
    );

    // ================================================================
    // Test 10: GET Review by ID (Populated Details)
    // ================================================================
    console.log('\n12. Test 10: GET Review by ID (Populated Details)');
    const singleRes = await makeRequest(`/api/admin/reviews/${review1._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(singleRes.status === 200, `GET /api/admin/reviews/:id returns 200 (got ${singleRes.status})`);
    const fetchedReview = singleRes.data.data;
    assert(fetchedReview._id === review1._id.toString(), 'Fetched correct review by ID');
    assert(fetchedReview.user && fetchedReview.user.name === 'er_sindhu', 'Populated user object with name');
    assert(fetchedReview.showroom && fetchedReview.showroom.name.includes('Flagship Worli'), 'Populated showroom object');
    assert(fetchedReview.rating === 5, 'Retained original rating 5');

    // ================================================================
    // Test 11: Invalid ObjectId Handling
    // ================================================================
    console.log('\n13. Test 11: Invalid ObjectId Handling');
    const malformedIdRes = await makeRequest('/api/admin/reviews/not-a-valid-id', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(malformedIdRes.status === 400, `Malformed ObjectId returns 400 (got ${malformedIdRes.status})`);

    // ================================================================
    // Test 12: Missing Review (404)
    // ================================================================
    console.log('\n14. Test 12: Missing Review Handling');
    const nonExistentId = '507f1f77bcf86cd799439099';
    const notFoundRes = await makeRequest(`/api/admin/reviews/${nonExistentId}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(notFoundRes.status === 404, `Non-existent review ID returns 404 (got ${notFoundRes.status})`);

    // ================================================================
    // Test 13: Valid Moderation / Status Update
    // ================================================================
    console.log('\n15. Test 13: Valid Moderation Status Update');
    const patchApproveRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      {
        status: 'approved',
        moderationNote: 'Verified feedback after customer contact.'
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(patchApproveRes.status === 200, `PATCH status to 'approved' returns 200 (got ${patchApproveRes.status})`);
    assert(patchApproveRes.data.data.status === 'approved', "Returned review has status='approved'");
    assert(patchApproveRes.data.data.moderationNote === 'Verified feedback after customer contact.', 'Moderation note saved');

    // Confirm persisted in MongoDB
    const verifyReview = await Review.findById(review1._id);
    assert(verifyReview.status === 'approved', 'Database record confirmed updated to approved');

    // Moderation: Transition to rejected
    const patchRejectRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      {
        status: 'rejected',
        moderationNote: 'Inappropriate language detected.'
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(patchRejectRes.status === 200, "Further transition to 'rejected' returns 200");
    assert(patchRejectRes.data.data.status === 'rejected', "Status is 'rejected'");

    // ================================================================
    // Test 14: Invalid Moderation Status Rejection
    // ================================================================
    console.log('\n16. Test 14: Invalid Moderation Status Rejection');
    const invalidStatusRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      { status: 'invalid_status_xyz' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(invalidStatusRes.status === 400, `Invalid status rejected with 400 (got ${invalidStatusRes.status})`);

    const emptyStatusRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      { status: '' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(emptyStatusRes.status === 400, `Empty status rejected with 400 (got ${emptyStatusRes.status})`);

    // Customer cannot patch moderation status
    const custPatchRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      { status: 'approved' },
      { Authorization: `Bearer ${customerToken}` }
    );
    assert(custPatchRes.status === 403, `Customer cannot PATCH review status (403 forbidden, got ${custPatchRes.status})`);

    // ================================================================
    // Test 15: Sensitive User Fields Not Exposed
    // ================================================================
    console.log('\n17. Test 15: Sensitive User Fields Not Exposed');
    const detailCheck = await makeRequest(`/api/admin/reviews/${review1._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    const populatedUser = detailCheck.data.data.user;
    assert(Boolean(populatedUser), 'User relationship is populated');
    assert(populatedUser.passwordHash === undefined, 'passwordHash is undefined / redacted');
    assert(populatedUser.password === undefined, 'password is undefined / redacted');
    assert(populatedUser.resetPasswordToken === undefined, 'resetPasswordToken is undefined / redacted');
    assert(populatedUser.tokens === undefined, 'tokens are undefined / redacted');

    // ================================================================
    // Test 16: MongoDB Injection Protection
    // ================================================================
    console.log('\n18. Test 16: MongoDB Injection Protection');
    const injectionBodyRes = await makeRequest(
      `/api/admin/reviews/${review1._id}/status`,
      'PATCH',
      {
        status: 'approved',
        '$set': { rating: 5, role: 'admin' }
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      injectionBodyRes.status === 400,
      `Operator injection in PATCH body rejected with 400 (got ${injectionBodyRes.status})`
    );

    const injectionQueryRes = await makeRequest(
      '/api/admin/reviews?status[$ne]=rejected',
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      injectionQueryRes.status === 400,
      `Operator injection in query parameters rejected with 400 (got ${injectionQueryRes.status})`
    );

    // ================================================================
    // Test 17: Existing Customer Review API Regression
    // ================================================================
    console.log('\n19. Test 17: Existing Customer Review API Regression');
    // Customer submits a new review via POST /api/reviews
    const custCreateRes = await makeRequest(
      '/api/reviews',
      'POST',
      {
        showroom: testShowroom2._id.toString(),
        rating: 5,
        title: `${testPrefix} Customer Submission`,
        comment: 'Great showroom ambiance and professional staff.'
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    assert(custCreateRes.status === 201, `Customer POST /api/reviews returns 201 (got ${custCreateRes.status})`);
    if (custCreateRes.data?.data?._id) {
      createdReviewIds.push(custCreateRes.data.data._id);
    }
    assert(custCreateRes.data.data.status === 'pending', "Customer-created review status is strictly initialized to 'pending'");

    // Customer views their own reviews via GET /api/reviews/my
    const custGetMyRes = await makeRequest('/api/reviews/my', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(custGetMyRes.status === 200, `Customer GET /api/reviews/my returns 200 (got ${custGetMyRes.status})`);
    assert(Array.isArray(custGetMyRes.data.data), 'Customer receives array of their own reviews');

    // Public showroom review list strictly excludes pending reviews
    const publicShowroomRes = await makeRequest(`/api/reviews/showroom/${testShowroom2._id}`);
    assert(publicShowroomRes.status === 200, 'Public GET /api/reviews/showroom/:id returns 200');
    const containsPending = publicShowroomRes.data.data.some(
      (r) => r._id === custCreateRes.data.data._id
    );
    assert(!containsPending, 'Pending review is strictly excluded from public showroom listing');

    // ================================================================
    // Test 18: Notification Regression
    // ================================================================
    console.log('\n20. Test 18: Review Notification Integration');
    // Customer should have received notification for review submission
    const notifs = await Notification.find({
      user: customerUser._id,
      type: 'REVIEW'
    });
    assert(notifs.length > 0, `Customer received review notification (found ${notifs.length})`);
    assert(notifs[0].title.includes('Review'), 'Notification title describes review event');

  } catch (error) {
    console.error('Unexpected error during test execution:', error);
    assert(false, `Unexpected error: ${error.message}`);
  } finally {
    // ================================================================
    // Test 19 & 20: Test Data Cleanup
    // ================================================================
    console.log('\n21. Test 19/20: Test Data Cleanup');
    try {
      if (createdReviewIds.length > 0) {
        const deletedReviews = await Review.deleteMany({ _id: { $in: createdReviewIds } });
        assert(deletedReviews.deletedCount > 0, `Cleaned up ${deletedReviews.deletedCount} test reviews`);
      }
      if (createdShowroomIds.length > 0) {
        await Showroom.deleteMany({ _id: { $in: createdShowroomIds } });
      }
      if (createdCityIds.length > 0) {
        await City.deleteMany({ _id: { $in: createdCityIds } });
      }
      if (createdBrandIds.length > 0) {
        await Brand.deleteMany({ _id: { $in: createdBrandIds } });
      }
      if (createdUserIds.length > 0) {
        const deletedUsers = await User.deleteMany({ _id: { $in: createdUserIds } });
        assert(deletedUsers.deletedCount > 0, `Cleaned up ${deletedUsers.deletedCount} test users`);
        await Notification.deleteMany({ user: { $in: createdUserIds } });
      }
      assert(true, 'Test data cleanup completed successfully');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    server.close();
    await disconnectDatabase();
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed}/${checks} checks passed. (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep4fTests();
