const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Brand, City, Bike, BikeVariant, Offer, Lead, Showroom } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runStep4eTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 5 ADMIN LEADS TEST SUITE          ');
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
    assert(isConnected(), 'Database connected successfully for Admin Leads testing');
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

  const testPrefix = `test-lead-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminPass123!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  // Track created entities for cleanup
  const createdUserIds = [];
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdShowroomIds = [];
  const createdBikeIds = [];
  const createdVariantIds = [];
  const createdOfferIds = [];
  const createdLeadIds = [];

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
      name: `${testPrefix} Flagship Showroom`,
      slug: `${testPrefix}-flagship-showroom`,
      brand: testBrand._id,
      city: testCity._id,
      dealerName: 'Apex Hero Motors',
      showroomType: 'Premia Flagship',
      address: {
        fullAddress: '100 Feet Road, Indiranagar',
        street: '100 Feet Road',
        area: 'Indiranagar',
        pincode: '560038'
      },
      contact: {
        phone: '+91 98765 43212',
        email: 'indiranagar@heromotors.example.com'
      },
      isActive: true
    });
    createdShowroomIds.push(testShowroom._id);

    // Seed test bike
    const testBike = await Bike.create({
      name: `${testPrefix} Mavrick 440`,
      slug: `${testPrefix}-mavrick-440`,
      brand: testBrand._id,
      category: 'Sport',
      priceRange: { minPrice: 199000, maxPrice: 224000 },
      fuelType: 'Petrol',
      isActive: true
    });
    createdBikeIds.push(testBike._id);

    // Seed test variant
    const testVariant = await BikeVariant.create({
      bike: testBike._id,
      name: `${testPrefix} Mavrick Top Spec`,
      slug: `${testPrefix}-mavrick-top-spec`,
      trim: 'Top',
      exShowroomPrice: 224000,
      isActive: true
    });
    createdVariantIds.push(testVariant._id);

    // Seed test offer
    const testOffer = await Offer.create({
      title: `${testPrefix} Festive Cashback`,
      slug: `${testPrefix}-festive-cashback`,
      description: 'Exclusive festival season cashback bonus for direct bookings.',
      bike: testBike._id,
      offerType: 'cashback',
      discountValue: 7500,
      validUntil: new Date(Date.now() + 86400000 * 30),
      isActive: true
    });
    createdOfferIds.push(testOffer._id);

    // Seed diverse leads
    const lead1 = await Lead.create({
      user: customerUser._id,
      name: 'er_sindhu Lead Alpha',
      email: `${testPrefix}-alpha@example.com`,
      phone: '+91 98765 43210',
      showroom: testShowroom._id,
      bike: testBike._id,
      variant: testVariant._id,
      offer: null,
      source: 'bike',
      status: 'new',
      message: 'Interested in booking immediately.'
    });
    createdLeadIds.push(lead1._id);

    const lead2 = await Lead.create({
      user: customerUser._id,
      name: 'er_sindhu Lead Beta',
      email: `${testPrefix}-beta@example.com`,
      phone: '+91 98765 43213',
      showroom: testShowroom._id,
      bike: testBike._id,
      variant: null,
      offer: testOffer._id,
      source: 'offer',
      status: 'qualified',
      message: 'Looking for financing options under the festive offer.'
    });
    createdLeadIds.push(lead2._id);

    const lead3 = await Lead.create({
      user: customerUser._id,
      name: 'er_sindhu Lead Gamma',
      email: `${testPrefix}-gamma@example.com`,
      phone: '+91 98765 43214',
      showroom: testShowroom._id,
      bike: testBike._id,
      variant: null,
      offer: null,
      source: 'showroom',
      status: 'converted',
      message: 'Retail delivery taken.'
    });
    createdLeadIds.push(lead3._id);

    console.log(`  Seeded 3 test leads for ${testPrefix}`);

    // ================================================================
    // Test 1: Admin Authentication
    // ================================================================
    console.log('\n3. Test 1: Admin Authentication');
    const authRes = await makeRequest('/api/admin/leads', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(authRes.status === 200, `Admin authenticated successfully (status 200, got ${authRes.status})`);
    assert(authRes.data && authRes.data.success === true, 'Response contains success=true');
    assert(Array.isArray(authRes.data.data), 'Response data is an array of leads');
    assert(Boolean(authRes.data.meta), 'Response contains pagination metadata');

    // ================================================================
    // Test 2: Non-Admin Rejection (RBAC)
    // ================================================================
    console.log('\n4. Test 2: Non-Admin Rejection');
    const unauthRes = await makeRequest('/api/admin/leads', 'GET');
    assert(unauthRes.status === 401, `Unauthenticated request rejected with 401 (got ${unauthRes.status})`);

    const customerRes = await makeRequest('/api/admin/leads', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerRes.status === 403, `Customer token rejected with 403 (got ${customerRes.status})`);

    // ================================================================
    // Test 3: GET Admin Leads (List & Metadata)
    // ================================================================
    console.log('\n5. Test 3: GET Admin Leads (List & Structure)');
    const listRes = await makeRequest(`/api/admin/leads?showroom=${testShowroom._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(listRes.status === 200, 'GET /api/admin/leads returns 200');
    assert(listRes.data.data.length >= 3, `Returns at least 3 seeded leads (found ${listRes.data.data.length})`);
    assert(listRes.data.meta.total >= 3, `Meta total matches count (total: ${listRes.data.meta.total})`);

    // ================================================================
    // Test 4: Search Filter
    // ================================================================
    console.log('\n6. Test 4: Search Filter');
    const searchRes = await makeRequest(
      `/api/admin/leads?search=${encodeURIComponent('Lead Alpha')}`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(searchRes.status === 200, 'Search request returns 200');
    const foundAlpha = searchRes.data.data.some((l) => l.name === 'er_sindhu Lead Alpha');
    const foundBeta = searchRes.data.data.some((l) => l.name === 'er_sindhu Lead Beta');
    assert(foundAlpha, "Search 'Lead Alpha' matched 'er_sindhu Lead Alpha'");
    assert(!foundBeta, "Search 'Lead Alpha' excluded 'er_sindhu Lead Beta'");

    // Search by message keyword
    const searchMsgRes = await makeRequest(
      `/api/admin/leads?search=${encodeURIComponent('financing')}`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(searchMsgRes.status === 200, 'Search by enquiry message keyword returns 200');
    const foundMsg = searchMsgRes.data.data.some((l) => l._id === lead2._id.toString());
    assert(foundMsg, 'Found lead matching message body');

    // ================================================================
    // Test 5: Status & Source Filtering
    // ================================================================
    console.log('\n7. Test 5: Status & Source Filtering');
    const statusRes = await makeRequest(
      `/api/admin/leads?showroom=${testShowroom._id}&status=qualified`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(statusRes.status === 200, "Filter by status='qualified' returns 200");
    const allQualified = statusRes.data.data.every((l) => l.status === 'qualified');
    assert(allQualified && statusRes.data.data.length > 0, 'All returned leads have status=qualified');

    const sourceRes = await makeRequest(
      `/api/admin/leads?showroom=${testShowroom._id}&source=offer`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(sourceRes.status === 200, "Filter by source='offer' returns 200");
    const allOfferSource = sourceRes.data.data.every((l) => l.source === 'offer');
    assert(allOfferSource && sourceRes.data.data.length > 0, 'All returned leads have source=offer');

    // ================================================================
    // Test 6: Pagination
    // ================================================================
    console.log('\n8. Test 6: Pagination');
    const pageRes = await makeRequest(
      `/api/admin/leads?showroom=${testShowroom._id}&page=1&limit=2`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(pageRes.status === 200, 'Pagination page=1&limit=2 returns 200');
    assert(pageRes.data.data.length === 2, `Returns exactly 2 items for limit=2 (got ${pageRes.data.data.length})`);
    assert(pageRes.data.meta.page === 1, 'Meta indicates page=1');
    assert(pageRes.data.meta.limit === 2, 'Meta indicates limit=2');
    assert(pageRes.data.meta.pages >= 2, `Total pages >= 2 for 3 items with limit=2 (pages: ${pageRes.data.meta.pages})`);

    // ================================================================
    // Test 7: Sorting Whitelist
    // ================================================================
    console.log('\n9. Test 7: Sorting Whitelist');
    const validSortRes = await makeRequest(
      `/api/admin/leads?showroom=${testShowroom._id}&sort=oldest`,
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(validSortRes.status === 200, "Valid sort 'oldest' returns 200");

    const invalidSortRes = await makeRequest(
      `/api/admin/leads?sort=hacked_sort_field`,
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
    // Test 8: GET Lead by ID (Populated Details)
    // ================================================================
    console.log('\n10. Test 8: GET Lead by ID (Populated Details)');
    const singleRes = await makeRequest(`/api/admin/leads/${lead1._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(singleRes.status === 200, `GET /api/admin/leads/:id returns 200 (got ${singleRes.status})`);
    const fetchedLead = singleRes.data.data;
    assert(fetchedLead._id === lead1._id.toString(), 'Fetched correct lead by ID');
    assert(fetchedLead.user && fetchedLead.user.name === 'er_sindhu', 'Populated user object with name');
    assert(fetchedLead.showroom && fetchedLead.showroom.name.includes('Flagship Showroom'), 'Populated showroom object');
    assert(fetchedLead.bike && fetchedLead.bike.name.includes('Mavrick 440'), 'Populated bike object');
    assert(fetchedLead.variant && fetchedLead.variant.name.includes('Top Spec'), 'Populated variant object');

    // ================================================================
    // Test 9: Invalid ObjectId Handling
    // ================================================================
    console.log('\n11. Test 9: Invalid ObjectId Handling');
    const malformedIdRes = await makeRequest('/api/admin/leads/invalid-not-hex', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(malformedIdRes.status === 400, `Malformed ObjectId returns 400 (got ${malformedIdRes.status})`);

    const nonExistentId = '507f1f77bcf86cd799439011';
    const notFoundRes = await makeRequest(`/api/admin/leads/${nonExistentId}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(notFoundRes.status === 404, `Non-existent lead ID returns 404 (got ${notFoundRes.status})`);

    // ================================================================
    // Test 10: PATCH Status (Valid Progression)
    // ================================================================
    console.log('\n12. Test 10: PATCH Status (Valid Progression)');
    const patchRes = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      { status: 'contacted' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(patchRes.status === 200, `PATCH status to 'contacted' returns 200 (got ${patchRes.status})`);
    assert(patchRes.data.data.status === 'contacted', "Returned lead has status='contacted'");

    // Verify in database
    const verifyLead = await Lead.findById(lead1._id);
    assert(verifyLead.status === 'contacted', 'Database record confirmed updated to contacted');

    // Transition further: contacted -> qualified
    const patchRes2 = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      { status: 'qualified' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(patchRes2.status === 200, "Further transition to 'qualified' returns 200");
    assert(patchRes2.data.data.status === 'qualified', "Status is 'qualified'");

    // ================================================================
    // Test 11: Invalid Status Rejection
    // ================================================================
    console.log('\n13. Test 11: Invalid Status Rejection');
    const invalidStatusRes = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      { status: 'bogus_status_123' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(invalidStatusRes.status === 400, `Invalid status rejected with 400 (got ${invalidStatusRes.status})`);

    const emptyStatusRes = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      { status: '' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(emptyStatusRes.status === 400, `Empty status rejected with 400 (got ${emptyStatusRes.status})`);

    // Non-admin cannot patch status
    const custPatchRes = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      { status: 'closed' },
      { Authorization: `Bearer ${customerToken}` }
    );
    assert(custPatchRes.status === 403, `Customer cannot PATCH status (403 forbidden, got ${custPatchRes.status})`);

    // ================================================================
    // Test 12: Existing Customer Lead API Regression
    // ================================================================
    console.log('\n14. Test 12: Existing Customer Lead API Regression');
    // Customer submits new lead via POST /api/leads
    const custCreateRes = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'er_sindhu',
        email: customerEmail,
        phone: '+91 98765 43210',
        showroom: testShowroom._id.toString(),
        bike: testBike._id.toString(),
        source: 'bike',
        message: 'Regression test enquiry from customer endpoint.'
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    assert(custCreateRes.status === 201, `Customer POST /api/leads returns 201 (got ${custCreateRes.status})`);
    const createdCustLead = custCreateRes.data?.data?.lead || custCreateRes.data?.lead;
    if (createdCustLead?._id) {
      createdLeadIds.push(createdCustLead._id);
    }
    assert(createdCustLead && createdCustLead.status === 'new', "Customer-created lead default status is 'new'");

    // Customer views their own leads via GET /api/leads/my
    const custGetRes = await makeRequest('/api/leads/my', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(custGetRes.status === 200, `Customer GET /api/leads/my returns 200 (got ${custGetRes.status})`);
    assert(Array.isArray(custGetRes.data.data), 'Customer receives array of their own leads');

    // ================================================================
    // Test 13: Sensitive User Fields Not Exposed
    // ================================================================
    console.log('\n15. Test 13: Sensitive User Fields Not Exposed');
    const detailCheck = await makeRequest(`/api/admin/leads/${lead1._id}`, 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    const populatedUser = detailCheck.data.data.user;
    assert(Boolean(populatedUser), 'User relationship is populated');
    assert(populatedUser.passwordHash === undefined, 'passwordHash is undefined / redacted');
    assert(populatedUser.password === undefined, 'password is undefined / redacted');
    assert(populatedUser.resetPasswordToken === undefined, 'resetPasswordToken is undefined / redacted');
    assert(populatedUser.tokens === undefined, 'tokens are undefined / redacted');

    // ================================================================
    // Test 14: MongoDB Operator Injection Protection
    // ================================================================
    console.log('\n16. Test 14: MongoDB Injection Protection');
    const injectionBodyRes = await makeRequest(
      `/api/admin/leads/${lead1._id}/status`,
      'PATCH',
      {
        status: 'converted',
        '$set': { role: 'superadmin' }
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      injectionBodyRes.status === 400,
      `Operator injection in PATCH body rejected with 400 (got ${injectionBodyRes.status})`
    );

    const injectionQueryRes = await makeRequest(
      '/api/admin/leads?status[$ne]=closed',
      'GET',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    // Validator enforces status must be string within allowed enum
    assert(
      injectionQueryRes.status === 400,
      `Operator injection in query parameters rejected with 400 (got ${injectionQueryRes.status})`
    );

  } catch (error) {
    console.error('Unexpected error during test execution:', error);
    assert(false, `Unexpected error: ${error.message}`);
  } finally {
    // ================================================================
    // Test 15: Thorough Test Data Cleanup
    // ================================================================
    console.log('\n17. Test 15: Test Data Cleanup');
    try {
      if (createdLeadIds.length > 0) {
        const deletedLeads = await Lead.deleteMany({ _id: { $in: createdLeadIds } });
        assert(deletedLeads.deletedCount > 0, `Cleaned up ${deletedLeads.deletedCount} test leads`);
      }
      if (createdOfferIds.length > 0) {
        await Offer.deleteMany({ _id: { $in: createdOfferIds } });
      }
      if (createdVariantIds.length > 0) {
        await BikeVariant.deleteMany({ _id: { $in: createdVariantIds } });
      }
      if (createdBikeIds.length > 0) {
        await Bike.deleteMany({ _id: { $in: createdBikeIds } });
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

runStep4eTests();
