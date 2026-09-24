const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables for database connection
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Bike, Showroom, Brand, City, Favorite } = require('./src/models');
const authConfig = require('./src/config/auth');

async function runStep3kTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 11 FAVORITES BACKEND AUDIT        ');
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
  console.log('1. Connecting to Database for Step 3K Audit:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Favorites testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    console.error('Database connection is required for live testing.');
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

      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(
        `http://127.0.0.1:${port}${pathUrl}`,
        { method, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch (e) {
              parsed = data;
            }
            resolve({ status: res.statusCode, data: parsed });
          });
        }
      );

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  // 3. Setup: Clean test data and create fixtures
  console.log('\n3. Setting up Test Fixtures:');
  const testEmail = `fav_test_${Date.now()}@herotest.com`;
  const testPassword = 'Test@1234';

  let testUser = null;
  let testToken = null;
  let testBike = null;
  let testShowroom = null;

  try {
    // Create a test brand and city for fixtures
    let brand = await Brand.findOne({ slug: 'hero-motocorp' });
    if (!brand) {
      brand = await Brand.create({
        name: 'Hero MotoCorp',
        slug: 'hero-motocorp',
        description: 'Flagship brand',
        logoUrl: '',
        isActive: true
      });
    }

    let city = await City.findOne({ slug: 'delhi' });
    if (!city) {
      city = await City.create({
        name: 'Delhi',
        slug: 'delhi',
        state: 'Delhi',
        isActive: true
      });
    }

    // Create test bike if none exists
    testBike = await Bike.findOne({ isActive: true });
    if (!testBike) {
      testBike = await Bike.create({
        name: 'Splendor Plus Test',
        slug: `splendor-plus-test-${Date.now()}`,
        brand: brand._id,
        category: 'Commuter',
        priceRange: { minPrice: 70000, maxPrice: 80000 },
        isActive: true
      });
    }
    assert(Boolean(testBike), `Test bike available: ${testBike?.name || 'N/A'}`);

    // Create test showroom if none exists
    testShowroom = await Showroom.findOne({ isActive: true });
    if (!testShowroom) {
      testShowroom = await Showroom.create({
        name: 'Test Hero Showroom',
        slug: `test-hero-showroom-${Date.now()}`,
        brand: brand._id,
        city: city._id,
        address: { fullAddress: '123 Test Street, Delhi' },
        contact: { phone: '9999999999' },
        isActive: true
      });
    }
    assert(Boolean(testShowroom), `Test showroom available: ${testShowroom?.name || 'N/A'}`);

    // Create test user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    testUser = await User.create({
      name: 'Favorites Tester',
      email: testEmail,
      passwordHash,
      role: 'customer',
      isActive: true
    });

    // Generate JWT for test user
    const secret = authConfig.getJwtSecret();
    testToken = jwt.sign(
      { sub: testUser._id.toString(), role: testUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    assert(Boolean(testUser), `Test user created: ${testEmail}`);
    assert(Boolean(testToken), 'JWT token generated for test user');
  } catch (err) {
    assert(false, `Test fixture setup failed: ${err.message}`);
    console.error(err);
  }

  // Clean any leftover favorites for this user before tests
  if (testUser) {
    await Favorite.deleteMany({ user: testUser._id });
  }

  // ============================================================
  // 4. Model and Schema Validation
  // ============================================================
  console.log('\n4. Favorite Model Schema Validation:');

  // Verify model exists and has correct fields
  const schema = Favorite.schema.paths;
  assert(Boolean(schema.user), 'Favorite schema has user field');
  assert(Boolean(schema.entityType), 'Favorite schema has entityType field');
  assert(Boolean(schema.bike), 'Favorite schema has bike field');
  assert(Boolean(schema.showroom), 'Favorite schema has showroom field');
  assert(Boolean(schema.createdAt), 'Favorite schema has timestamps (createdAt)');

  // ============================================================
  // 5. Authentication Guards
  // ============================================================
  console.log('\n5. Authentication Guards:');

  const unauthToggle = await makeRequest('/api/favorites/toggle', 'POST', {
    entityType: 'bike',
    entityId: testBike?._id?.toString() || '507f1f77bcf86cd799439011'
  });
  assert(unauthToggle.status === 401, 'POST /api/favorites/toggle requires authentication (401)');

  const unauthCheck = await makeRequest('/api/favorites/check?entityType=bike&entityId=507f1f77bcf86cd799439011');
  assert(unauthCheck.status === 401, 'GET /api/favorites/check requires authentication (401)');

  const unauthMy = await makeRequest('/api/favorites/my');
  assert(unauthMy.status === 401, 'GET /api/favorites/my requires authentication (401)');

  // ============================================================
  // 6. Toggle: Add Bike Favorite
  // ============================================================
  console.log('\n6. Toggle: Add Bike Favorite:');

  if (testBike && testToken) {
    const addBike = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'bike', entityId: testBike._id.toString() },
      { Authorization: `Bearer ${testToken}` }
    );

    assert(addBike.status === 200, 'POST /api/favorites/toggle (bike) returns 200');
    assert(addBike.data?.success === true, 'Response success=true when adding bike favorite');
    assert(addBike.data?.data?.favorited === true, 'Response favorited=true after adding');
    assert(Boolean(addBike.data?.data?.favorite), 'Response includes favorite document');
    assert(
      addBike.data?.data?.favorite?.entityType === 'bike',
      'Favorite entityType is "bike"'
    );
    assert(
      addBike.data?.data?.favorite?.bike?._id?.toString() === testBike._id.toString() ||
      addBike.data?.data?.favorite?.bike?.toString() === testBike._id.toString(),
      'Favorite references correct bike'
    );
  } else {
    assert(false, 'Skipped bike toggle add test — fixture unavailable');
  }

  // ============================================================
  // 7. Check Favorite Status
  // ============================================================
  console.log('\n7. Check Favorite Status:');

  if (testBike && testToken) {
    const checkFav = await makeRequest(
      `/api/favorites/check?entityType=bike&entityId=${testBike._id}`,
      'GET',
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assert(checkFav.status === 200, 'GET /api/favorites/check returns 200');
    assert(checkFav.data?.success === true, 'Check favorite response success=true');
    assert(checkFav.data?.data?.favorited === true, 'Check confirms bike is favorited');

    // Check an un-favorited entity
    const fakeBikeId = new mongoose.Types.ObjectId().toString();
    const checkNotFav = await makeRequest(
      `/api/favorites/check?entityType=bike&entityId=${fakeBikeId}`,
      'GET',
      null,
      { Authorization: `Bearer ${testToken}` }
    );
    assert(checkNotFav.status === 200 || checkNotFav.status === 404, 'Check for un-favorited bike handled gracefully');
  } else {
    assert(false, 'Skipped check test — fixture unavailable');
  }

  // ============================================================
  // 8. Get My Favorites (bike listed)
  // ============================================================
  console.log('\n8. Get My Favorites:');

  if (testToken) {
    const myFavs = await makeRequest('/api/favorites/my', 'GET', null, {
      Authorization: `Bearer ${testToken}`
    });

    assert(myFavs.status === 200, 'GET /api/favorites/my returns 200');
    assert(myFavs.data?.success === true, 'My favorites response success=true');
    assert(Array.isArray(myFavs.data?.data), 'My favorites data is an array');
    assert(myFavs.data?.data?.length >= 1, 'My favorites contains at least 1 entry');
    assert(Boolean(myFavs.data?.meta), 'My favorites response includes pagination meta');
    assert(typeof myFavs.data?.meta?.total === 'number', 'Meta includes total count');

    // Filter by entityType=bike
    const myBikeFavs = await makeRequest('/api/favorites/my?entityType=bike', 'GET', null, {
      Authorization: `Bearer ${testToken}`
    });
    assert(myBikeFavs.status === 200, 'GET /api/favorites/my?entityType=bike returns 200');
    assert(Array.isArray(myBikeFavs.data?.data), 'Filtered favorites is an array');
  } else {
    assert(false, 'Skipped get my favorites — token unavailable');
  }

  // ============================================================
  // 9. Toggle: Add Showroom Favorite
  // ============================================================
  console.log('\n9. Toggle: Add Showroom Favorite:');

  if (testShowroom && testToken) {
    const addShowroom = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'showroom', entityId: testShowroom._id.toString() },
      { Authorization: `Bearer ${testToken}` }
    );

    assert(addShowroom.status === 200, 'POST /api/favorites/toggle (showroom) returns 200');
    assert(addShowroom.data?.data?.favorited === true, 'Showroom favorited successfully');
    assert(addShowroom.data?.data?.favorite?.entityType === 'showroom', 'Favorite entityType is "showroom"');
  } else {
    assert(false, 'Skipped showroom toggle add test — fixture unavailable');
  }

  // ============================================================
  // 10. Toggle: Remove Bike Favorite (second toggle = remove)
  // ============================================================
  console.log('\n10. Toggle: Remove Bike Favorite:');

  if (testBike && testToken) {
    const removeBike = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'bike', entityId: testBike._id.toString() },
      { Authorization: `Bearer ${testToken}` }
    );

    assert(removeBike.status === 200, 'POST /api/favorites/toggle (remove) returns 200');
    assert(removeBike.data?.data?.favorited === false, 'Response favorited=false after removal');
    assert(removeBike.data?.data?.favorite === null, 'Response favorite=null after removal');

    // Verify DB removal
    const dbCheck = await Favorite.findOne({
      user: testUser._id,
      entityType: 'bike',
      bike: testBike._id
    });
    assert(!dbCheck, 'Bike favorite removed from database after second toggle');
  } else {
    assert(false, 'Skipped bike remove toggle test — fixture unavailable');
  }

  // ============================================================
  // 11. Validation Tests
  // ============================================================
  console.log('\n11. Validator Tests:');

  if (testToken) {
    // Missing entityType
    const missingType = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityId: testBike?._id?.toString() || '507f1f77bcf86cd799439011' },
      { Authorization: `Bearer ${testToken}` }
    );
    assert(missingType.status === 400, 'Missing entityType returns 400');

    // Invalid entityType
    const invalidType = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'offer', entityId: testBike?._id?.toString() || '507f1f77bcf86cd799439011' },
      { Authorization: `Bearer ${testToken}` }
    );
    assert(invalidType.status === 400, 'Invalid entityType "offer" returns 400');

    // Missing entityId
    const missingId = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'bike' },
      { Authorization: `Bearer ${testToken}` }
    );
    assert(missingId.status === 400, 'Missing entityId returns 400');

    // Invalid entityId (not ObjectId)
    const invalidId = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'bike', entityId: 'not-a-valid-id' },
      { Authorization: `Bearer ${testToken}` }
    );
    assert(invalidId.status === 400, 'Invalid entityId returns 400');

    // Client-supplied user field must be stripped (not cause error)
    const withUserId = await makeRequest(
      '/api/favorites/toggle',
      'POST',
      { entityType: 'showroom', entityId: testShowroom?._id?.toString() || '507f1f77bcf86cd799439011', user: 'hacker' },
      { Authorization: `Bearer ${testToken}` }
    );
    assert(
      withUserId.status === 200 || withUserId.status === 400,
      'Client-supplied user field is stripped or rejected (not used)'
    );
  } else {
    assert(false, 'Skipped validator tests — token unavailable');
  }

  // ============================================================
  // 12. Ownership Security: Other user cannot see this user's favorites
  // ============================================================
  console.log('\n12. Ownership Isolation:');

  const otherEmail = `fav_other_${Date.now()}@herotest.com`;
  let otherToken = null;
  try {
    const passwordHash2 = await bcrypt.hash(testPassword, 10);
    const otherUser = await User.create({
      name: 'Other Tester',
      email: otherEmail,
      passwordHash: passwordHash2,
      role: 'customer',
      isActive: true
    });
    const secret = authConfig.getJwtSecret();
    otherToken = jwt.sign(
      { sub: otherUser._id.toString(), role: otherUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const otherFavs = await makeRequest('/api/favorites/my', 'GET', null, {
      Authorization: `Bearer ${otherToken}`
    });

    assert(otherFavs.status === 200, 'Other user gets 200 for their own favorites');
    assert(otherFavs.data?.data?.length === 0, 'Other user sees 0 favorites (isolated ownership)');

    // Clean up other user
    await User.deleteOne({ _id: otherUser._id });
  } catch (err) {
    assert(false, `Ownership isolation test failed: ${err.message}`);
  }

  // ============================================================
  // 13. Cleanup
  // ============================================================
  console.log('\n13. Cleaning up test data:');
  try {
    if (testUser) {
      await Favorite.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
      assert(true, 'Test user and favorites cleaned up');
    }
  } catch (err) {
    console.warn(`  Cleanup warning: ${err.message}`);
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n================================================================');
  console.log(' PHASE 3 STEP 11 — FAVORITES AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`  Total Checks : ${checks}`);
  console.log(`  Passed       : ${passed}`);
  console.log(`  Failed       : ${failed}`);
  console.log('================================================================\n');

  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();

  if (failed > 0) {
    process.exit(1);
  }
}

runStep3kTests().catch((err) => {
  console.error('Unexpected error during favorites test:', err);
  process.exit(1);
});
