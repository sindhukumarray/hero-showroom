const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Brand, City, Showroom, Bike } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runStep4bTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 2 ADMIN BRANDS & CITIES TEST SUITE');
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
    assert(isConnected(), 'Database connected successfully for Admin Brands & Cities testing');
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

  const testPrefix = `test-admin-b2-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'SecureAdminPass2026!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  // Track created entities for thorough cleanup
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdShowroomIds = [];

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test customer
    customerUser = await User.create({
      name: 'Catalogue Customer',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43210',
      role: ROLES.CUSTOMER,
      isActive: true
    });

    const secret = authConfig.getJwtSecret();

    customerToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Create test admin
    adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 43211',
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

    console.log('\n============================================================');
    console.log(' SECTION A: ADMIN BRAND MANAGEMENT (Step 15: 1 - 10)');
    console.log('============================================================');

    // 1. Unauthenticated GET /api/admin/brands → 401
    const unauthBrandsRes = await makeRequest('/api/admin/brands', 'GET');
    assert(
      unauthBrandsRes.status === 401,
      `Assertion 1: Unauthenticated GET /api/admin/brands returns 401 (got ${unauthBrandsRes.status})`
    );

    // 2. Customer GET /api/admin/brands → 403
    const customerBrandsRes = await makeRequest('/api/admin/brands', 'GET', null, customerHeaders);
    assert(
      customerBrandsRes.status === 403,
      `Assertion 2: Customer GET /api/admin/brands returns 403 Forbidden (got ${customerBrandsRes.status})`
    );

    // 3. Admin GET /api/admin/brands → 200
    const adminBrandsRes = await makeRequest('/api/admin/brands', 'GET', null, adminHeaders);
    assert(
      adminBrandsRes.status === 200 && Array.isArray(adminBrandsRes.data?.data),
      `Assertion 3: Admin GET /api/admin/brands returns 200 with list (count: ${adminBrandsRes.data?.data?.length})`
    );

    // 4. Admin create POST /api/admin/brands → 201
    const brandPayload = {
      name: `Vida Electric ${Date.now()}`,
      slug: `vida-electric-${Date.now()}`,
      description: 'Hero MotoCorp Next-Gen Electric Mobility',
      originCountry: 'India',
      website: 'https://vidaworld.com',
      isActive: true
    };
    const createBrandRes = await makeRequest('/api/admin/brands', 'POST', brandPayload, adminHeaders);
    assert(
      createBrandRes.status === 201 && createBrandRes.data?.data?._id,
      `Assertion 4: Admin create POST /api/admin/brands returns 201 with brand entity`
    );
    const brand1 = createBrandRes.data?.data;
    if (brand1?._id) createdBrandIds.push(brand1._id);

    // 5. Duplicate brand POST /api/admin/brands → 400
    const dupBrandRes = await makeRequest('/api/admin/brands', 'POST', brandPayload, adminHeaders);
    assert(
      dupBrandRes.status === 400 && dupBrandRes.data?.success === false,
      `Assertion 5: Duplicate brand creation is rejected with 400 (got ${dupBrandRes.status}: "${dupBrandRes.data?.message}")`
    );

    // 6. Admin update PUT /api/admin/brands/:id → 200
    const updateBrandPayload = {
      name: `${brand1.name} Updated`,
      description: 'Updated Electric Innovation Mobility'
    };
    const updateBrandRes = await makeRequest(
      `/api/admin/brands/${brand1._id}`,
      'PUT',
      updateBrandPayload,
      adminHeaders
    );
    assert(
      updateBrandRes.status === 200 && updateBrandRes.data?.data?.name === updateBrandPayload.name,
      `Assertion 6: Admin update PUT /api/admin/brands/:id returns 200 with updated fields`
    );

    // 7. Invalid ObjectId PUT /api/admin/brands/:id → 400
    const invalidIdBrandRes = await makeRequest(
      '/api/admin/brands/invalid-not-an-objectid',
      'PUT',
      { name: 'Invalid ID Test' },
      adminHeaders
    );
    assert(
      invalidIdBrandRes.status === 400,
      `Assertion 7: Invalid ObjectId yields 400 validation error (got ${invalidIdBrandRes.status})`
    );

    // 8. Status update PATCH /api/admin/brands/:id/status → 200
    const statusBrandRes = await makeRequest(
      `/api/admin/brands/${brand1._id}/status`,
      'PATCH',
      { isActive: false },
      adminHeaders
    );
    assert(
      statusBrandRes.status === 200 && statusBrandRes.data?.data?.isActive === false,
      `Assertion 8: Status update PATCH /api/admin/brands/:id/status returns 200 and toggles isActive to false`
    );

    // 9. Referenced brand deletion DELETE /api/admin/brands/:id → safe behavior
    // Find or create a city for the showroom reference
    let dummyCity = await City.findOne();
    if (!dummyCity) {
      dummyCity = await City.create({
        name: 'Fixture City',
        slug: `fixture-city-${Date.now()}`,
        state: 'Maharashtra',
        isActive: true
      });
      createdCityIds.push(dummyCity._id);
    }

    const refShowroom = await Showroom.create({
      name: `Test Reference Showroom ${Date.now()}`,
      slug: `ref-showroom-${Date.now()}`,
      brand: brand1._id,
      city: dummyCity._id,
      address: {
        street: '123 Showcase Boulevard',
        pincode: '400001',
        fullAddress: '123 Showcase Boulevard, Mumbai, Maharashtra 400001'
      },
      contact: {
        phone: '9876543210',
        email: 'ref-showroom@example.com'
      },
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.076]
      },
      isActive: true
    });
    createdShowroomIds.push(refShowroom._id);

    const refBrandDeleteRes = await makeRequest(
      `/api/admin/brands/${brand1._id}`,
      'DELETE',
      null,
      adminHeaders
    );
    assert(
      refBrandDeleteRes.status === 200 &&
        refBrandDeleteRes.data?.data?.deactivated === true &&
        refBrandDeleteRes.data?.data?.deleted === false,
      `Assertion 9: Deletion of referenced brand safely deactivates instead of deleting (deactivated: true, deleted: false)`
    );

    // 10. Missing/invalid payload POST /api/admin/brands → 400 validation error
    const invalidBrandPayloadRes = await makeRequest(
      '/api/admin/brands',
      'POST',
      { originCountry: 'India' }, // missing name and slug
      adminHeaders
    );
    assert(
      invalidBrandPayloadRes.status === 400 && Array.isArray(invalidBrandPayloadRes.data?.errors),
      `Assertion 10: Missing required brand fields yields 400 validation error with descriptive messages`
    );

    // Extra Brand Assertion: Unreferenced brand hard deletion
    const unrefBrandRes = await makeRequest(
      '/api/admin/brands',
      'POST',
      {
        name: `Temp Brand ${Date.now()}`,
        slug: `temp-brand-${Date.now()}`,
        isActive: true
      },
      adminHeaders
    );
    const unrefBrandId = unrefBrandRes.data?.data?._id;
    if (unrefBrandId) {
      const deleteUnrefRes = await makeRequest(
        `/api/admin/brands/${unrefBrandId}`,
        'DELETE',
        null,
        adminHeaders
      );
      assert(
        deleteUnrefRes.status === 200 && deleteUnrefRes.data?.data?.deleted === true,
        `Extra Brand Assertion: Unreferenced brand is permanently deleted (deleted: true)`
      );
    }

    console.log('\n============================================================');
    console.log(' SECTION B: ADMIN CITY MANAGEMENT (Step 15: 11 - 20)');
    console.log('============================================================');

    // 11. Unauthenticated GET /api/admin/cities → 401
    const unauthCitiesRes = await makeRequest('/api/admin/cities', 'GET');
    assert(
      unauthCitiesRes.status === 401,
      `Assertion 11: Unauthenticated GET /api/admin/cities returns 401 (got ${unauthCitiesRes.status})`
    );

    // 12. Customer GET /api/admin/cities → 403
    const customerCitiesRes = await makeRequest('/api/admin/cities', 'GET', null, customerHeaders);
    assert(
      customerCitiesRes.status === 403,
      `Assertion 12: Customer GET /api/admin/cities returns 403 Forbidden (got ${customerCitiesRes.status})`
    );

    // 13. Admin GET /api/admin/cities → 200
    const adminCitiesRes = await makeRequest('/api/admin/cities', 'GET', null, adminHeaders);
    assert(
      adminCitiesRes.status === 200 && Array.isArray(adminCitiesRes.data?.data),
      `Assertion 13: Admin GET /api/admin/cities returns 200 with list (count: ${adminCitiesRes.data?.data?.length})`
    );

    // 14. Admin create POST /api/admin/cities → 201
    const cityPayload = {
      name: `Navi Mumbai ${Date.now()}`,
      slug: `navi-mumbai-${Date.now()}`,
      state: 'Maharashtra',
      country: 'India',
      tier: 'Tier 1',
      coordinates: { latitude: 19.033, longitude: 73.0297 },
      isActive: true
    };
    const createCityRes = await makeRequest('/api/admin/cities', 'POST', cityPayload, adminHeaders);
    assert(
      createCityRes.status === 201 && createCityRes.data?.data?._id,
      `Assertion 14: Admin create POST /api/admin/cities returns 201 with city entity`
    );
    const city1 = createCityRes.data?.data;
    if (city1?._id) createdCityIds.push(city1._id);

    // 15. Duplicate city POST /api/admin/cities → 400
    const dupCityRes = await makeRequest('/api/admin/cities', 'POST', cityPayload, adminHeaders);
    assert(
      dupCityRes.status === 400 && dupCityRes.data?.success === false,
      `Assertion 15: Duplicate city creation is rejected with 400 (got ${dupCityRes.status}: "${dupCityRes.data?.message}")`
    );

    // 16. Admin update PUT /api/admin/cities/:id → 200
    const updateCityPayload = {
      name: `${city1.name} Central`,
      tier: 'Metro'
    };
    const updateCityRes = await makeRequest(
      `/api/admin/cities/${city1._id}`,
      'PUT',
      updateCityPayload,
      adminHeaders
    );
    assert(
      updateCityRes.status === 200 &&
        updateCityRes.data?.data?.name === updateCityPayload.name &&
        updateCityRes.data?.data?.tier === 'Metro',
      `Assertion 16: Admin update PUT /api/admin/cities/:id returns 200 with updated fields`
    );

    // 17. Invalid ObjectId PUT /api/admin/cities/:id → 400
    const invalidIdCityRes = await makeRequest(
      '/api/admin/cities/bad-city-object-id',
      'PUT',
      { name: 'Invalid City ID' },
      adminHeaders
    );
    assert(
      invalidIdCityRes.status === 400,
      `Assertion 17: Invalid ObjectId yields 400 validation error (got ${invalidIdCityRes.status})`
    );

    // 18. Status update PATCH /api/admin/cities/:id/status → 200
    const statusCityRes = await makeRequest(
      `/api/admin/cities/${city1._id}/status`,
      'PATCH',
      { isActive: false },
      adminHeaders
    );
    assert(
      statusCityRes.status === 200 && statusCityRes.data?.data?.isActive === false,
      `Assertion 18: Status update PATCH /api/admin/cities/:id/status returns 200 and toggles isActive to false`
    );

    // 19. Referenced city deletion DELETE /api/admin/cities/:id → safe behavior
    // Create a showroom referencing city1 (by ObjectId if schema supports or name)
    const refCityShowroom = await Showroom.create({
      name: `City Test Showroom ${Date.now()}`,
      slug: `city-test-showroom-${Date.now()}`,
      brand: brand1._id,
      city: city1._id,
      address: {
        street: '789 City Centre Avenue',
        pincode: '400002',
        fullAddress: `789 City Centre Avenue, ${city1.name}, ${city1.state} 400002`
      },
      contact: {
        phone: '9876543212',
        email: 'city-ref-showroom@example.com'
      },
      location: {
        type: 'Point',
        coordinates: [73.0297, 19.033]
      },
      isActive: true
    });
    createdShowroomIds.push(refCityShowroom._id);

    const refCityDeleteRes = await makeRequest(
      `/api/admin/cities/${city1._id}`,
      'DELETE',
      null,
      adminHeaders
    );
    assert(
      refCityDeleteRes.status === 200 &&
        refCityDeleteRes.data?.data?.deactivated === true &&
        refCityDeleteRes.data?.data?.deleted === false,
      `Assertion 19: Deletion of referenced city safely deactivates instead of deleting (deactivated: true, deleted: false)`
    );

    // 20. Missing/invalid payload POST /api/admin/cities → 400 validation error
    const invalidCityPayloadRes = await makeRequest(
      '/api/admin/cities',
      'POST',
      { country: 'India' }, // missing name, slug, state
      adminHeaders
    );
    assert(
      invalidCityPayloadRes.status === 400 && Array.isArray(invalidCityPayloadRes.data?.errors),
      `Assertion 20: Missing required city fields yields 400 validation error with descriptive messages`
    );

    // Extra City Assertion: Unreferenced city hard deletion
    const unrefCityRes = await makeRequest(
      '/api/admin/cities',
      'POST',
      {
        name: `Temp City ${Date.now()}`,
        slug: `temp-city-${Date.now()}`,
        state: 'Goa',
        isActive: true
      },
      adminHeaders
    );
    const unrefCityId = unrefCityRes.data?.data?._id;
    if (unrefCityId) {
      const deleteUnrefCityRes = await makeRequest(
        `/api/admin/cities/${unrefCityId}`,
        'DELETE',
        null,
        adminHeaders
      );
      assert(
        deleteUnrefCityRes.status === 200 && deleteUnrefCityRes.data?.data?.deleted === true,
        `Extra City Assertion: Unreferenced city is permanently deleted (deleted: true)`
      );
    }

    console.log('\n============================================================');
    console.log(' SECTION C: PUBLIC CATALOGUE REGRESSION SAFETY');
    console.log('============================================================');

    const publicBrandsRes = await makeRequest('/api/brands', 'GET');
    assert(
      publicBrandsRes.status === 200 && Array.isArray(publicBrandsRes.data?.data),
      `Regression 1: Public GET /api/brands is functional and accessible without authentication (got 200)`
    );

    const publicCitiesRes = await makeRequest('/api/cities', 'GET');
    assert(
      publicCitiesRes.status === 200 && Array.isArray(publicCitiesRes.data?.data),
      `Regression 2: Public GET /api/cities is functional and accessible without authentication (got 200)`
    );
  } finally {
    // Clean up created test entities
    console.log('\n3. Cleaning up Test Artifacts:');
    try {
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
  console.log(` STEP 4B TEST RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4bTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
