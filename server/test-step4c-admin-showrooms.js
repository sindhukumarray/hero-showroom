const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Brand, City, Showroom, Lead, Bike } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runStep4cTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 3 ADMIN SHOWROOMS TEST SUITE      ');
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
    assert(isConnected(), 'Database connected successfully for Admin Showrooms testing');
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

  const testPrefix = `test-admin-sr-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminShowroomPass2026!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  // Track created entities for thorough cleanup
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdShowroomIds = [];
  const createdLeadIds = [];

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const secret = authConfig.getJwtSecret();

    // Create test customer
    customerUser = await User.create({
      name: 'Showroom Customer',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 44410',
      role: ROLES.CUSTOMER,
      isActive: true
    });

    customerToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Create test admin
    adminUser = await User.create({
      name: 'Showroom Administrator',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 44411',
      role: ROLES.ADMIN,
      isActive: true
    });

    adminToken = jwt.sign(
      { sub: adminUser._id.toString(), role: adminUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const customerHeaders = { Authorization: `Bearer ${customerToken}` };

    // Create test fixture Brand and City
    const fixtureBrand = await Brand.create({
      name: `Fixture Brand ${Date.now()}`,
      slug: `fixture-brand-${Date.now()}`,
      originCountry: 'India',
      isActive: true
    });
    createdBrandIds.push(fixtureBrand._id);

    const fixtureCity = await City.create({
      name: `Fixture City ${Date.now()}`,
      slug: `fixture-city-${Date.now()}`,
      state: 'Karnataka',
      tier: 'Metro',
      isActive: true
    });
    createdCityIds.push(fixtureCity._id);

    console.log('\n============================================================');
    console.log(' SECTION A: AUTHORIZATION (Step 15: 1 - 3)');
    console.log('============================================================');

    // 1. Unauthenticated GET /api/admin/showrooms → 401
    const unauthShowroomsRes = await makeRequest('/api/admin/showrooms', 'GET');
    assert(
      unauthShowroomsRes.status === 401,
      `Assertion 1: Unauthenticated GET /api/admin/showrooms returns 401 (got ${unauthShowroomsRes.status})`
    );

    // 2. Customer GET /api/admin/showrooms → 403
    const customerShowroomsRes = await makeRequest('/api/admin/showrooms', 'GET', null, customerHeaders);
    assert(
      customerShowroomsRes.status === 403,
      `Assertion 2: Customer GET /api/admin/showrooms returns 403 Forbidden (got ${customerShowroomsRes.status})`
    );

    // 3. Admin GET /api/admin/showrooms → 200
    const adminShowroomsRes = await makeRequest('/api/admin/showrooms', 'GET', null, adminHeaders);
    assert(
      adminShowroomsRes.status === 200 && Array.isArray(adminShowroomsRes.data?.data),
      `Assertion 3: Admin GET /api/admin/showrooms returns 200 with list (count: ${adminShowroomsRes.data?.data?.length})`
    );

    console.log('\n============================================================');
    console.log(' SECTION B: LIST & FILTERING (Step 15: 4 - 5)');
    console.log('============================================================');

    // 4. Admin list returns valid showroom data
    assert(
      adminShowroomsRes.data?.meta && typeof adminShowroomsRes.data.meta.total === 'number',
      `Assertion 4: Admin list response returns valid metadata pagination (total: ${adminShowroomsRes.data?.meta?.total})`
    );

    // 5. Search/filter behavior
    const filteredRes = await makeRequest(
      `/api/admin/showrooms?brand=${fixtureBrand._id}&city=${fixtureCity._id}&isActive=all`,
      'GET',
      null,
      adminHeaders
    );
    assert(
      filteredRes.status === 200 && Array.isArray(filteredRes.data?.data),
      `Assertion 5: Admin list supports brand and city query filtering (count: ${filteredRes.data?.data?.length})`
    );

    console.log('\n============================================================');
    console.log(' SECTION C: SHOWROOM CREATION & VALIDATION (Step 15: 6 - 11)');
    console.log('============================================================');

    // 6. Valid Admin create → 201
    const showroomPayload = {
      name: `Hero Central Lounge ${Date.now()}`,
      slug: `hero-central-lounge-${Date.now()}`,
      brand: fixtureBrand._id.toString(),
      city: fixtureCity._id.toString(),
      dealerName: 'Vanguard Auto Wheels',
      showroomType: 'Premia Flagship',
      address: {
        fullAddress: 'No. 500, MG Road, Bengaluru, Karnataka 560001',
        street: 'MG Road',
        area: 'Central Business District',
        pincode: '560001'
      },
      contact: {
        phone: '+91 80 2558 1111',
        alternatePhone: '+91 98450 12345',
        email: 'bengaluru.central@heroshowroom.in',
        website: 'https://vanguardhero.example.com'
      },
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // [lng, lat]
      },
      facilities: ['Test Rides Available', 'Authorized Service', 'Premia Customer Lounge'],
      isActive: true,
      isVerified: true
    };

    const createShowroomRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      showroomPayload,
      adminHeaders
    );
    assert(
      createShowroomRes.status === 201 && createShowroomRes.data?.data?._id,
      `Assertion 6: Valid Admin create POST /api/admin/showrooms returns 201 with showroom entity`
    );
    const showroom1 = createShowroomRes.data?.data;
    if (showroom1?._id) createdShowroomIds.push(showroom1._id);

    // 7. Missing required fields → 400
    const missingFieldsRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      { name: 'Missing Details Showroom' }, // missing slug, brand, city, fullAddress, phone
      adminHeaders
    );
    assert(
      missingFieldsRes.status === 400 && Array.isArray(missingFieldsRes.data?.errors),
      `Assertion 7: Missing required showroom fields yields 400 with validation errors (${missingFieldsRes.data?.errors?.length} issues)`
    );

    // 8. Invalid Brand ID format → 400
    const invalidBrandIdRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      {
        ...showroomPayload,
        slug: `hero-invalid-brand-${Date.now()}`,
        brand: 'not-a-valid-hex-object-id'
      },
      adminHeaders
    );
    assert(
      invalidBrandIdRes.status === 400,
      `Assertion 8: Invalid Brand ID string returns 400 validation error (got ${invalidBrandIdRes.status})`
    );

    // 9. Invalid City ID format → 400
    const invalidCityIdRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      {
        ...showroomPayload,
        slug: `hero-invalid-city-${Date.now()}`,
        city: 'not-a-valid-city-id-12345'
      },
      adminHeaders
    );
    assert(
      invalidCityIdRes.status === 400,
      `Assertion 9: Invalid City ID string returns 400 validation error (got ${invalidCityIdRes.status})`
    );

    // 10. Non-existent Brand (valid ObjectId that does not exist in DB) → 400
    const nonExistentBrandId = '507f1f77bcf86cd799439011';
    const nonExistentBrandRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      {
        ...showroomPayload,
        slug: `hero-nonexistent-brand-${Date.now()}`,
        brand: nonExistentBrandId
      },
      adminHeaders
    );
    assert(
      nonExistentBrandRes.status === 400 &&
        nonExistentBrandRes.data?.message?.includes('Referenced brand does not exist'),
      `Assertion 10: Non-existent Brand ID yields clean 400 business error: "${nonExistentBrandRes.data?.message}"`
    );

    // 11. Non-existent City (valid ObjectId that does not exist in DB) → 400
    const nonExistentCityId = '507f1f77bcf86cd799439022';
    const nonExistentCityRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      {
        ...showroomPayload,
        slug: `hero-nonexistent-city-${Date.now()}`,
        city: nonExistentCityId
      },
      adminHeaders
    );
    assert(
      nonExistentCityRes.status === 400 &&
        nonExistentCityRes.data?.message?.includes('Referenced city does not exist'),
      `Assertion 11: Non-existent City ID yields clean 400 business error: "${nonExistentCityRes.data?.message}"`
    );

    console.log('\n============================================================');
    console.log(' SECTION D: SHOWROOM UPDATES & STATUS (Step 15: 12 - 17)');
    console.log('============================================================');

    // 12. Valid update PUT /api/admin/showrooms/:id → 200
    const updateShowroomRes = await makeRequest(
      `/api/admin/showrooms/${showroom1._id}`,
      'PUT',
      {
        name: `${showroom1.name} (Updated Flagship)`,
        dealerName: 'Apex Mobility Systems'
      },
      adminHeaders
    );
    assert(
      updateShowroomRes.status === 200 &&
        updateShowroomRes.data?.data?.name === `${showroom1.name} (Updated Flagship)` &&
        updateShowroomRes.data?.data?.dealerName === 'Apex Mobility Systems',
      `Assertion 12: Valid update returns 200 with updated showroom attributes`
    );

    // 13. Invalid showroom ObjectId → 400
    const invalidIdRes = await makeRequest(
      '/api/admin/showrooms/bad-showroom-object-id',
      'PUT',
      { name: 'Invalid ID Test' },
      adminHeaders
    );
    assert(
      invalidIdRes.status === 400,
      `Assertion 13: Invalid showroom ObjectId yields 400 validation error (got ${invalidIdRes.status})`
    );

    // 14. Missing showroom → 404
    const nonExistentShowroomId = '507f1f77bcf86cd799439033';
    const missingShowroomRes = await makeRequest(
      `/api/admin/showrooms/${nonExistentShowroomId}`,
      'PUT',
      { name: 'Non Existent Showroom' },
      adminHeaders
    );
    assert(
      missingShowroomRes.status === 404,
      `Assertion 14: Updating non-existent showroom yields 404 Not Found (got ${missingShowroomRes.status})`
    );

    // 15. Invalid updated references → 400
    const invalidRefUpdateRes = await makeRequest(
      `/api/admin/showrooms/${showroom1._id}`,
      'PUT',
      { brand: nonExistentBrandId },
      adminHeaders
    );
    assert(
      invalidRefUpdateRes.status === 400 &&
        invalidRefUpdateRes.data?.message?.includes('Referenced brand does not exist'),
      `Assertion 15: Updating showroom with non-existent brand reference is rejected with 400`
    );

    // 16. Valid status update PATCH /api/admin/showrooms/:id/status → 200
    const statusUpdateRes = await makeRequest(
      `/api/admin/showrooms/${showroom1._id}/status`,
      'PATCH',
      { isActive: false },
      adminHeaders
    );
    assert(
      statusUpdateRes.status === 200 && statusUpdateRes.data?.data?.isActive === false,
      `Assertion 16: Valid status patch toggles isActive to false (got 200)`
    );

    // 17. Invalid status payload → 400
    const invalidStatusRes = await makeRequest(
      `/api/admin/showrooms/${showroom1._id}/status`,
      'PATCH',
      { isActive: 'not-a-boolean' },
      adminHeaders
    );
    assert(
      invalidStatusRes.status === 400,
      `Assertion 17: Invalid status payload (non-boolean) is rejected with 400 (got ${invalidStatusRes.status})`
    );

    console.log('\n============================================================');
    console.log(' SECTION E: DELETION SAFETY & DEPENDENCY CHECKS (Step 15: 18 - 20)');
    console.log('============================================================');

    // 18. Referenced showroom → safely deactivated
    // Find or create a bike for the lead reference
    let dummyBike = await Bike.findOne();
    if (!dummyBike) {
      dummyBike = await Bike.create({
        name: 'Fixture Test Bike',
        slug: `fixture-bike-${Date.now()}`,
        brand: fixtureBrand._id,
        category: 'Commuter',
        engineCapacity: 125,
        isActive: true
      });
    }

    // Create a customer enquiry Lead referencing showroom1
    const testLead = await Lead.create({
      user: customerUser._id,
      name: 'Enquiry Customer',
      phone: '+91 98765 00000',
      email: customerUser.email,
      showroom: showroom1._id,
      bike: dummyBike._id,
      leadType: 'showroom',
      status: 'new'
    });
    createdLeadIds.push(testLead._id);

    const refShowroomDeleteRes = await makeRequest(
      `/api/admin/showrooms/${showroom1._id}`,
      'DELETE',
      null,
      adminHeaders
    );
    assert(
      refShowroomDeleteRes.status === 200 &&
        refShowroomDeleteRes.data?.data?.deactivated === true &&
        refShowroomDeleteRes.data?.data?.deleted === false,
      `Assertion 18: Deletion of referenced showroom safely deactivates instead of deleting (deactivated: true, deleted: false)`
    );

    // 19. Unreferenced showroom → safely deleted
    const unrefShowroomRes = await makeRequest(
      '/api/admin/showrooms',
      'POST',
      {
        ...showroomPayload,
        name: `Temp Showroom ${Date.now()}`,
        slug: `temp-sr-${Date.now()}`,
        address: { fullAddress: 'Temporary Showroom Road, Bengaluru 560002' },
        isActive: true
      },
      adminHeaders
    );
    const unrefId = unrefShowroomRes.data?.data?._id;
    if (unrefId) {
      const deleteUnrefRes = await makeRequest(
        `/api/admin/showrooms/${unrefId}`,
        'DELETE',
        null,
        adminHeaders
      );
      assert(
        deleteUnrefRes.status === 200 && deleteUnrefRes.data?.data?.deleted === true,
        `Assertion 19: Unreferenced showroom is permanently deleted when no dependencies exist (deleted: true)`
      );
    }

    // 20. Related entities remain intact
    const survivingLead = await Lead.findById(testLead._id);
    assert(
      survivingLead !== null && survivingLead.showroom.toString() === showroom1._id.toString(),
      `Assertion 20: Related Lead entity remains completely intact after showroom deactivation`
    );

    console.log('\n============================================================');
    console.log(' SECTION F: REGRESSION CHECKS (Step 15: 21 - 27)');
    console.log('============================================================');

    // 21. Public GET /api/showrooms
    const publicShowroomsRes = await makeRequest('/api/showrooms', 'GET');
    assert(
      publicShowroomsRes.status === 200 && Array.isArray(publicShowroomsRes.data?.data),
      `Assertion 21: Public GET /api/showrooms returns 200 and is functional without auth`
    );

    // 22. Public showroom detail (/api/showrooms/:slug)
    const publicDetailRes = await makeRequest(`/api/showrooms/${showroom1.slug}`, 'GET');
    assert(
      publicDetailRes.status === 200 && publicDetailRes.data?.data?.slug === showroom1.slug,
      `Assertion 22: Public GET /api/showrooms/:slug returns 200 with populated details`
    );

    // 23. Public Brand API
    const publicBrandsRes = await makeRequest('/api/brands', 'GET');
    assert(
      publicBrandsRes.status === 200 && Array.isArray(publicBrandsRes.data?.data),
      `Assertion 23: Existing public Brand API returns 200 without regressions`
    );

    // 24. Public City API
    const publicCitiesRes = await makeRequest('/api/cities', 'GET');
    assert(
      publicCitiesRes.status === 200 && Array.isArray(publicCitiesRes.data?.data),
      `Assertion 24: Existing public City API returns 200 without regressions`
    );

    // 25. Admin Brand and City APIs
    const [adminBrandsCheck, adminCitiesCheck] = await Promise.all([
      makeRequest('/api/admin/brands', 'GET', null, adminHeaders),
      makeRequest('/api/admin/cities', 'GET', null, adminHeaders)
    ]);
    assert(
      adminBrandsCheck.status === 200 && adminCitiesCheck.status === 200,
      `Assertion 25: Admin Brand and City APIs remain fully functional under admin RBAC (both 200)`
    );

    // 26. Auth / RBAC guard verification
    const customerOnAdminBrands = await makeRequest('/api/admin/brands', 'GET', null, customerHeaders);
    assert(
      customerOnAdminBrands.status === 403,
      `Assertion 26: Customer token accessing /api/admin/brands properly returns 403 Forbidden`
    );

    // 27. Public Health check
    const healthCheckRes = await makeRequest('/api/health', 'GET');
    assert(
      healthCheckRes.status === 200,
      `Assertion 27: Public /api/health endpoint returns 200 OK`
    );

  } finally {
    // Clean up created test entities
    console.log('\n3. Cleaning up Test Artifacts:');
    try {
      if (createdLeadIds.length > 0) {
        await Lead.deleteMany({ _id: { $in: createdLeadIds } });
        console.log(`  Cleaned up ${createdLeadIds.length} test leads`);
      }
      if (createdShowroomIds.length > 0) {
        await Showroom.deleteMany({ _id: { $in: createdShowroomIds } });
        console.log(`  Cleaned up ${createdShowroomIds.length} test showrooms`);
      }
      if (createdBrandIds.length > 0) {
        await Brand.deleteMany({ _id: { $in: createdBrandIds } });
        console.log(`  Cleaned up ${createdBrandIds.length} test brands`);
      }
      if (createdCityIds.length > 0) {
        await City.deleteMany({ _id: { $in: createdCityIds } });
        console.log(`  Cleaned up ${createdCityIds.length} test cities`);
      }
      if (customerUser?._id) {
        await User.findByIdAndDelete(customerUser._id);
        console.log('  Cleaned up test customer user');
      }
      if (adminUser?._id) {
        await User.findByIdAndDelete(adminUser._id);
        console.log('  Cleaned up test admin user');
      }
    } catch (cleanupErr) {
      console.warn(`  Cleanup warning: ${cleanupErr.message}`);
    }

    server.close();
    await disconnectDatabase();
    console.log('  Test server closed and database disconnected.');
  }

  console.log('\n================================================================');
  console.log(` STEP 4C TEST RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4cTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
