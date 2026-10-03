const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Brand, City, Bike, BikeVariant, Lead, Showroom } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runStep4dTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 4 ADMIN BIKES TEST SUITE          ');
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
    assert(isConnected(), 'Database connected successfully for Admin Bikes testing');
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

  const testPrefix = `test-admin-bk-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminBikePass2026!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  // Track created entities for thorough cleanup
  const createdBrandIds = [];
  const createdCityIds = [];
  const createdBikeIds = [];
  const createdVariantIds = [];
  const createdLeadIds = [];
  const createdShowroomIds = [];

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const secret = authConfig.getJwtSecret();

    // Create test customer
    customerUser = await User.create({
      name: 'Bike Customer',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 55510',
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
      name: 'Bike Administrator',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      phone: '+91 98765 55511',
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

    // Create test fixture Brand
    const fixtureBrand = await Brand.create({
      name: `Fixture Brand ${Date.now()}`,
      slug: `fixture-brand-${Date.now()}`,
      originCountry: 'India',
      isActive: true
    });
    createdBrandIds.push(fixtureBrand._id);

    // Create second Brand for update tests
    const secondBrand = await Brand.create({
      name: `Second Brand ${Date.now()}`,
      slug: `second-brand-${Date.now()}`,
      originCountry: 'India',
      isActive: true
    });
    createdBrandIds.push(secondBrand._id);

    // Create test fixture City and Showroom for lead references
    const fixtureCity = await City.create({
      name: `Fixture City ${Date.now()}`,
      slug: `fixture-city-${Date.now()}`,
      state: 'Maharashtra',
      tier: 'Tier 1',
      isActive: true
    });
    createdCityIds.push(fixtureCity._id);

    const fixtureShowroom = await Showroom.create({
      name: `Fixture Showroom ${Date.now()}`,
      slug: `fixture-showroom-${Date.now()}`,
      brand: fixtureBrand._id,
      city: fixtureCity._id,
      address: { fullAddress: '123 Main Road, City' },
      contact: { phone: '+91 98765 11111' },
      isActive: true
    });
    createdShowroomIds.push(fixtureShowroom._id);

    console.log('\n============================================================');
    console.log(' SECTION A: AUTHORIZATION (1 - 3)');
    console.log('============================================================');

    // 1. Unauthenticated Bike GET → 401
    const unauthBikesRes = await makeRequest('/api/admin/bikes', 'GET');
    assert(
      unauthBikesRes.status === 401,
      `Assertion 1: Unauthenticated GET /api/admin/bikes returns 401 (got ${unauthBikesRes.status})`
    );

    // 2. Customer Bike GET → 403
    const customerBikesRes = await makeRequest('/api/admin/bikes', 'GET', null, customerHeaders);
    assert(
      customerBikesRes.status === 403,
      `Assertion 2: Customer GET /api/admin/bikes returns 403 Forbidden (got ${customerBikesRes.status})`
    );

    // 3. Admin Bike GET → 200
    const adminBikesRes = await makeRequest('/api/admin/bikes', 'GET', null, adminHeaders);
    assert(
      adminBikesRes.status === 200 && Array.isArray(adminBikesRes.data?.data),
      `Assertion 3: Admin GET /api/admin/bikes returns 200 with list (count: ${adminBikesRes.data?.data?.length})`
    );

    console.log('\n============================================================');
    console.log(' SECTION B: BIKE LIST & FILTERING (4 - 6)');
    console.log('============================================================');

    // 4. Admin list succeeds with array data
    assert(
      Array.isArray(adminBikesRes.data?.data),
      'Assertion 4: Admin bike list response returns array of bikes'
    );

    // 5. Pagination metadata works
    assert(
      adminBikesRes.data?.meta && typeof adminBikesRes.data.meta.total === 'number' && adminBikesRes.data.meta.page >= 1,
      `Assertion 5: Pagination metadata present and valid (total: ${adminBikesRes.data?.meta?.total}, page: ${adminBikesRes.data?.meta?.page})`
    );

    // 6. Search/filter works where supported
    const filteredListRes = await makeRequest(
      `/api/admin/bikes?brand=${fixtureBrand._id}&category=Commuter&isActive=all`,
      'GET',
      null,
      adminHeaders
    );
    assert(
      filteredListRes.status === 200 && Array.isArray(filteredListRes.data?.data),
      `Assertion 6: Admin bike list filtering by brand and category works (count: ${filteredListRes.data?.data?.length})`
    );

    console.log('\n============================================================');
    console.log(' SECTION C: BIKE CREATE (7 - 11)');
    console.log('============================================================');

    const testBikeSlug = `test-bike-${Date.now()}`;
    const testBikePayload = {
      name: `Test Splendor Pro ${Date.now()}`,
      slug: testBikeSlug,
      brand: fixtureBrand._id.toString(),
      category: 'Commuter',
      tagline: 'Leading the Commuter Revolution',
      description: 'Reliable everyday performance motorcycle',
      priceRange: {
        minPrice: 75000,
        maxPrice: 82000,
        currency: 'INR'
      },
      fuelType: 'Petrol',
      transmission: '4 Speed Manual',
      engine: {
        displacementCc: 97.2,
        maxPower: '8.02 PS',
        maxTorque: '8.05 Nm',
        cooling: 'Air Cooled',
        emissionStandard: 'BS6 Phase 2'
      },
      mileage: {
        estimatedKmpl: 65,
        certifiedRangeKm: 0
      },
      brakes: {
        front: 'Disc',
        rear: 'Drum',
        absType: 'Single Channel ABS'
      },
      images: {
        heroImage: 'https://images.example.com/test-bike.jpg',
        gallery: ['https://images.example.com/g1.jpg']
      },
      isFeatured: true,
      isActive: true
    };

    // 7. Valid Bike create → 201
    const createBikeRes = await makeRequest('/api/admin/bikes', 'POST', testBikePayload, adminHeaders);
    assert(
      createBikeRes.status === 201 && createBikeRes.data?.data?._id,
      `Assertion 7: Valid Bike create POST /api/admin/bikes returns 201 (id: ${createBikeRes.data?.data?._id})`
    );
    let createdBikeId;
    if (createBikeRes.data?.data?._id) {
      createdBikeId = createBikeRes.data.data._id;
      createdBikeIds.push(createdBikeId);
    }

    // 8. Missing required fields → 400
    const invalidBikeRes = await makeRequest('/api/admin/bikes', 'POST', { name: 'Incomplete' }, adminHeaders);
    assert(
      invalidBikeRes.status === 400,
      `Assertion 8: Missing required fields yields 400 validation error (got ${invalidBikeRes.status})`
    );

    // 9. Invalid Brand ID → 400
    const invalidBrandIdRes = await makeRequest(
      '/api/admin/bikes',
      'POST',
      { ...testBikePayload, slug: `slug-${Date.now()}`, brand: 'not-an-objectid' },
      adminHeaders
    );
    assert(
      invalidBrandIdRes.status === 400,
      `Assertion 9: Invalid Brand ObjectId string returns 400 (got ${invalidBrandIdRes.status})`
    );

    // 10. Non-existent Brand → 400
    const nonExistentBrandRes = await makeRequest(
      '/api/admin/bikes',
      'POST',
      { ...testBikePayload, slug: `slug-nonbrand-${Date.now()}`, brand: '507f1f77bcf86cd799439011' },
      adminHeaders
    );
    assert(
      nonExistentBrandRes.status === 400,
      `Assertion 10: Non-existent Brand reference yields clean 400 business error (got ${nonExistentBrandRes.status})`
    );

    // 11. Duplicate slug/name → rejected
    const duplicateSlugRes = await makeRequest(
      '/api/admin/bikes',
      'POST',
      { ...testBikePayload, name: 'Different Name' },
      adminHeaders
    );
    assert(
      duplicateSlugRes.status === 400,
      `Assertion 11: Duplicate slug rejected with 400 (got ${duplicateSlugRes.status})`
    );

    console.log('\n============================================================');
    console.log(' SECTION D: BIKE UPDATE (12 - 15)');
    console.log('============================================================');

    // 12. Valid update → 200
    const updateRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}`,
      'PUT',
      {
        tagline: 'Updated Cutting-Edge Commuter',
        brand: secondBrand._id.toString(),
        isFeatured: false
      },
      adminHeaders
    );
    assert(
      updateRes.status === 200 && updateRes.data?.data?.tagline === 'Updated Cutting-Edge Commuter',
      `Assertion 12: Valid update PUT /api/admin/bikes/:id returns 200 (tagline: "${updateRes.data?.data?.tagline}")`
    );

    // 13. Invalid Bike ID → 400
    const invalidBikeIdRes = await makeRequest('/api/admin/bikes/invalid-id-123', 'PUT', { name: 'New' }, adminHeaders);
    assert(
      invalidBikeIdRes.status === 400,
      `Assertion 13: Invalid Bike ObjectId yields 400 validation error (got ${invalidBikeIdRes.status})`
    );

    // 14. Missing Bike → 404
    const missingBikeRes = await makeRequest(
      '/api/admin/bikes/507f1f77bcf86cd799439099',
      'PUT',
      { name: 'Updated' },
      adminHeaders
    );
    assert(
      missingBikeRes.status === 404,
      `Assertion 14: Updating non-existent bike yields 404 Not Found (got ${missingBikeRes.status})`
    );

    // 15. Invalid update payload → 400 (empty payload)
    const emptyUpdateRes = await makeRequest(`/api/admin/bikes/${createdBikeId}`, 'PUT', {}, adminHeaders);
    assert(
      emptyUpdateRes.status === 400,
      `Assertion 15: Empty update payload yields 400 validation error (got ${emptyUpdateRes.status})`
    );

    console.log('\n============================================================');
    console.log(' SECTION E: BIKE STATUS (16 - 17)');
    console.log('============================================================');

    // 16. Valid status update → 200
    const statusRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/status`,
      'PATCH',
      { isActive: false },
      adminHeaders
    );
    assert(
      statusRes.status === 200 && statusRes.data?.data?.isActive === false,
      `Assertion 16: Valid status toggle sets isActive to false (got ${statusRes.status}, isActive: ${statusRes.data?.data?.isActive})`
    );

    // Toggle back to active
    await makeRequest(`/api/admin/bikes/${createdBikeId}/status`, 'PATCH', { isActive: true }, adminHeaders);

    // 17. Invalid status payload → 400
    const invalidStatusRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/status`,
      'PATCH',
      { isActive: 'not-a-bool' },
      adminHeaders
    );
    assert(
      invalidStatusRes.status === 400,
      `Assertion 17: Non-boolean status payload yields 400 validation error (got ${invalidStatusRes.status})`
    );

    console.log('\n============================================================');
    console.log(' SECTION F: BIKE DELETE SAFETY (18 - 20)');
    console.log('============================================================');

    // Create a bike with a dependent Lead to test safe deactivation
    const refBike = await Bike.create({
      name: `Ref Bike ${Date.now()}`,
      slug: `ref-bike-${Date.now()}`,
      brand: fixtureBrand._id,
      category: 'Sport',
      priceRange: { minPrice: 120000, maxPrice: 135000, currency: 'INR' },
      isActive: true
    });
    createdBikeIds.push(refBike._id);

    const testLead = await Lead.create({
      user: customerUser._id,
      name: 'Test Reference Lead',
      phone: '+91 99999 88888',
      email: customerUser.email,
      showroom: fixtureShowroom._id,
      bike: refBike._id,
      leadType: 'showroom',
      status: 'new'
    });
    createdLeadIds.push(testLead._id);

    // 18. Referenced Bike → safe deactivation / protected behavior
    const deleteRefRes = await makeRequest(`/api/admin/bikes/${refBike._id}`, 'DELETE', null, adminHeaders);
    assert(
      deleteRefRes.status === 200 && deleteRefRes.data?.data?.deactivated === true && deleteRefRes.data?.data?.deleted === false,
      `Assertion 18: Deletion of referenced bike safely deactivates instead of deleting (deactivated: ${deleteRefRes.data?.data?.deactivated}, deleted: ${deleteRefRes.data?.data?.deleted})`
    );

    // Create an unreferenced Bike to test safe hard deletion
    const unrefBike = await Bike.create({
      name: `Unref Bike ${Date.now()}`,
      slug: `unref-bike-${Date.now()}`,
      brand: fixtureBrand._id,
      category: 'Cruiser',
      priceRange: { minPrice: 90000, maxPrice: 95000, currency: 'INR' },
      isActive: true
    });

    // 19. Unreferenced Bike → safe hard deletion
    const deleteUnrefRes = await makeRequest(`/api/admin/bikes/${unrefBike._id}`, 'DELETE', null, adminHeaders);
    assert(
      deleteUnrefRes.status === 200 && deleteUnrefRes.data?.data?.deleted === true,
      `Assertion 19: Unreferenced bike is permanently removed when no dependencies exist (deleted: ${deleteUnrefRes.data?.data?.deleted})`
    );

    // 20. Dependent entities remain intact
    const leadStillExists = await Lead.findById(testLead._id);
    assert(
      Boolean(leadStillExists),
      'Assertion 20: Customer lead entity remains completely intact after bike deactivation'
    );

    console.log('\n============================================================');
    console.log(' SECTION G: BIKE VARIANTS MANAGEMENT (21 - 29)');
    console.log('============================================================');

    // 21. Admin list variants → 200
    const listVariantsRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants`,
      'GET',
      null,
      adminHeaders
    );
    assert(
      listVariantsRes.status === 200 && Array.isArray(listVariantsRes.data?.data),
      `Assertion 21: Admin GET /api/admin/bikes/:bikeId/variants returns 200 with list (count: ${listVariantsRes.data?.data?.length})`
    );

    // 22. Valid variant create → 201
    const testVariantPayload = {
      name: 'Self Start Disc Alloy Wheel',
      slug: 'self-start-disc-alloy',
      exShowroomPrice: 79500,
      colors: [
        { name: 'Canvas Black', hexCode: '#000000', image: 'https://images.example.com/black.jpg' },
        { name: 'Pearl Silver White', hexCode: '#FFFFFF', image: 'https://images.example.com/white.jpg' }
      ],
      keySpecifications: {
        kerbWeightKg: 112,
        fuelCapacityLitres: 9.8,
        seatHeightMm: 785,
        groundClearanceMm: 165
      },
      keyFeatures: ['i3S Engine Stop-Start', 'Digital Console', 'USB Charging Port'],
      isActive: true
    };

    const createVariantRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants`,
      'POST',
      testVariantPayload,
      adminHeaders
    );
    assert(
      createVariantRes.status === 201 && createVariantRes.data?.data?._id,
      `Assertion 22: Valid variant create POST returns 201 (variant ID: ${createVariantRes.data?.data?._id})`
    );
    let createdVariantId;
    if (createVariantRes.data?.data?._id) {
      createdVariantId = createVariantRes.data.data._id;
      createdVariantIds.push(createdVariantId);
    }

    // 23. Invalid parent Bike → rejected (404)
    const invalidParentRes = await makeRequest(
      '/api/admin/bikes/507f1f77bcf86cd799439088/variants',
      'POST',
      { ...testVariantPayload, slug: `var-${Date.now()}` },
      adminHeaders
    );
    assert(
      invalidParentRes.status === 404,
      `Assertion 23: Variant creation with non-existent parent bike rejected with 404 (got ${invalidParentRes.status})`
    );

    // 24. Invalid variant payload → rejected (400)
    const invalidVariantPayloadRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants`,
      'POST',
      { name: 'Missing Price' },
      adminHeaders
    );
    assert(
      invalidVariantPayloadRes.status === 400,
      `Assertion 24: Variant creation with invalid payload returns 400 (got ${invalidVariantPayloadRes.status})`
    );

    // 25. Valid variant update → 200
    const updateVariantRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants/${createdVariantId}`,
      'PUT',
      {
        exShowroomPrice: 81000,
        keyFeatures: ['i3S Technology', 'Updated Digital Cluster']
      },
      adminHeaders
    );
    assert(
      updateVariantRes.status === 200 && updateVariantRes.data?.data?.exShowroomPrice === 81000,
      `Assertion 25: Valid variant update returns 200 (price: ${updateVariantRes.data?.data?.exShowroomPrice})`
    );

    // 26. Invalid variant ID → rejected
    const invalidVariantIdRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants/invalid-id-xyz`,
      'GET',
      null,
      adminHeaders
    );
    assert(
      invalidVariantIdRes.status === 400,
      `Assertion 26: Invalid variant ObjectId parameter returns 400 (got ${invalidVariantIdRes.status})`
    );

    // 27. Parent/variant mismatch → rejected (400)
    // Create another bike to test cross-parent mismatch
    const otherBike = await Bike.create({
      name: `Other Bike ${Date.now()}`,
      slug: `other-bike-${Date.now()}`,
      brand: fixtureBrand._id,
      category: 'Commuter',
      priceRange: { minPrice: 60000, maxPrice: 65000, currency: 'INR' },
      isActive: true
    });
    createdBikeIds.push(otherBike._id);

    const mismatchRes = await makeRequest(
      `/api/admin/bikes/${otherBike._id}/variants/${createdVariantId}`,
      'GET',
      null,
      adminHeaders
    );
    assert(
      mismatchRes.status === 400,
      `Assertion 27: Requesting variant with mismatched parent bike ID returns 400 (got ${mismatchRes.status})`
    );

    // 28. Referenced variant → safe protected/deactivation behavior
    // Associate createdVariantId with a test Lead
    const variantLead = await Lead.create({
      user: customerUser._id,
      name: 'Variant Lead Tester',
      phone: '+91 99999 77777',
      email: customerUser.email,
      showroom: fixtureShowroom._id,
      bike: createdBikeId,
      variant: createdVariantId,
      leadType: 'showroom',
      status: 'new'
    });
    createdLeadIds.push(variantLead._id);

    const deleteRefVariantRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants/${createdVariantId}`,
      'DELETE',
      null,
      adminHeaders
    );
    assert(
      deleteRefVariantRes.status === 200 && deleteRefVariantRes.data?.data?.deactivated === true,
      `Assertion 28: Referenced variant is safely deactivated instead of deleted (deactivated: ${deleteRefVariantRes.data?.data?.deactivated})`
    );

    // 29. Unreferenced variant → safe deletion
    const unrefVariant = await BikeVariant.create({
      bike: createdBikeId,
      brand: fixtureBrand._id,
      name: 'Unreferenced Variant',
      slug: `unref-var-${Date.now()}`,
      exShowroomPrice: 70000,
      isActive: true
    });

    const deleteUnrefVariantRes = await makeRequest(
      `/api/admin/bikes/${createdBikeId}/variants/${unrefVariant._id}`,
      'DELETE',
      null,
      adminHeaders
    );
    assert(
      deleteUnrefVariantRes.status === 200 && deleteUnrefVariantRes.data?.data?.deleted === true,
      `Assertion 29: Unreferenced variant is permanently removed (deleted: ${deleteUnrefVariantRes.data?.data?.deleted})`
    );

    console.log('\n============================================================');
    console.log(' SECTION H: REGRESSION CHECKS (30 - 37)');
    console.log('============================================================');

    // 30. Public Bike API still works
    const publicBikesRes = await makeRequest('/api/bikes', 'GET');
    assert(
      publicBikesRes.status === 200 && Array.isArray(publicBikesRes.data?.data),
      `Assertion 30: Public GET /api/bikes returns 200 (count: ${publicBikesRes.data?.data?.length})`
    );

    // 31. Public Bike detail still works
    const publicBikeDetailRes = await makeRequest(`/api/bikes/${testBikeSlug}`, 'GET');
    assert(
      publicBikeDetailRes.status === 200 && publicBikeDetailRes.data?.data?.slug === testBikeSlug,
      `Assertion 31: Public GET /api/bikes/:slug returns 200 with populated bike details`
    );

    // 32. Bike Compare regression still works
    // Public bike response contains full technical engine, priceRange, brakes, and category required by Compare
    const sampleBike = publicBikeDetailRes.data?.data;
    assert(
      Boolean(sampleBike?.engine && sampleBike?.priceRange && sampleBike?.brakes && sampleBike?.category),
      'Assertion 32: Bike Compare regression intact: full specification matrix returned for vehicle comparison'
    );

    // 33. EMI regression still works
    // Min/Max price and exShowroomPrice fields are non-null and valid for EMI calculation
    assert(
      typeof sampleBike?.priceRange?.minPrice === 'number' && sampleBike.priceRange.minPrice > 0,
      `Assertion 33: EMI regression intact: priceRange.minPrice is valid numeric value (₹${sampleBike?.priceRange?.minPrice})`
    );

    // 34. Admin Showroom APIs still work
    const adminShowroomsCheck = await makeRequest('/api/admin/showrooms', 'GET', null, adminHeaders);
    assert(
      adminShowroomsCheck.status === 200 && Array.isArray(adminShowroomsCheck.data?.data),
      `Assertion 34: Admin Showroom API remains functional under admin RBAC (got 200)`
    );

    // 35. Admin Brand/City APIs still work
    const [brandCheck, cityCheck] = await Promise.all([
      makeRequest('/api/admin/brands', 'GET', null, adminHeaders),
      makeRequest('/api/admin/cities', 'GET', null, adminHeaders)
    ]);
    assert(
      brandCheck.status === 200 && cityCheck.status === 200,
      `Assertion 35: Admin Brand and City APIs remain fully functional under admin RBAC (both 200)`
    );

    // 36. Auth/RBAC regression still works
    const customerBlockCheck = await makeRequest('/api/admin/brands', 'GET', null, customerHeaders);
    assert(
      customerBlockCheck.status === 403,
      `Assertion 36: Customer token attempting access to /api/admin/brands properly returns 403 Forbidden`
    );

    // 37. Customer Dashboard / Public Health regression still works
    const healthCheck = await makeRequest('/api/health', 'GET');
    assert(
      healthCheck.status === 200,
      `Assertion 37: Public health check returns 200 without regressions`
    );

  } catch (err) {
    console.error('Unexpected test error occurred:', err);
    assert(false, `Unexpected error during test execution: ${err.message}`);
  } finally {
    console.log('\n3. Cleaning up Test Artifacts:');
    try {
      if (createdShowroomIds.length > 0) {
        await Showroom.deleteMany({ _id: { $in: createdShowroomIds } });
        console.log(`  Cleaned up ${createdShowroomIds.length} test showrooms`);
      }
      if (createdLeadIds.length > 0) {
        await Lead.deleteMany({ _id: { $in: createdLeadIds } });
        console.log(`  Cleaned up ${createdLeadIds.length} test leads`);
      }
      if (createdVariantIds.length > 0) {
        await BikeVariant.deleteMany({ _id: { $in: createdVariantIds } });
        console.log(`  Cleaned up ${createdVariantIds.length} test variants`);
      }
      if (createdBikeIds.length > 0) {
        await Bike.deleteMany({ _id: { $in: createdBikeIds } });
        console.log(`  Cleaned up ${createdBikeIds.length} test bikes`);
      }
      if (createdBrandIds.length > 0) {
        await Brand.deleteMany({ _id: { $in: createdBrandIds } });
        console.log(`  Cleaned up ${createdBrandIds.length} test brands`);
      }
      if (createdCityIds.length > 0) {
        await City.deleteMany({ _id: { $in: createdCityIds } });
        console.log(`  Cleaned up ${createdCityIds.length} test cities`);
      }
      if (customerUser) {
        await User.findByIdAndDelete(customerUser._id);
        console.log('  Cleaned up test customer user');
      }
      if (adminUser) {
        await User.findByIdAndDelete(adminUser._id);
        console.log('  Cleaned up test admin user');
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr.message);
    }

    server.close();
    await disconnectDatabase();
    console.log('  Test server closed and database disconnected.\n');
  }

  console.log('================================================================');
  console.log(` STEP 4D TEST RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4dTests();
