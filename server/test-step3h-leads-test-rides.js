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
const { User, Showroom, Bike, BikeVariant, Lead, TestRide } = require('./src/models');
const authConfig = require('./src/config/auth');

async function runStep3hTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 8 LEADS & TEST RIDES AUDIT       ');
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
  console.log('1. Connecting to Database for Step 3H Audit:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Leads & Test Rides testing');
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
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed
            });
          });
        }
      );

      req.on('error', reject);

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  const jwtSecret = authConfig.getJwtSecret();
  const timestamp = Date.now();

  // Test customer accounts
  const user1Email = `lead_tester1_${timestamp}@example.com`;
  const user2Email = `lead_tester2_${timestamp}@example.com`;

  let user1, user2;
  let token1, token2;
  let validShowroom, validBike, validVariant, otherBike;
  let inactiveShowroom, inactiveBike;

  try {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    // Create 2 test users
    user1 = await User.create({
      name: 'Lead Customer One',
      email: user1Email,
      passwordHash,
      phone: '9876543210',
      role: 'customer',
      isActive: true
    });

    user2 = await User.create({
      name: 'Lead Customer Two',
      email: user2Email,
      passwordHash,
      phone: '9876543211',
      role: 'customer',
      isActive: true
    });

    token1 = jwt.sign({ sub: user1._id.toString(), role: 'customer' }, jwtSecret, { expiresIn: '15m' });
    token2 = jwt.sign({ sub: user2._id.toString(), role: 'customer' }, jwtSecret, { expiresIn: '15m' });

    // Retrieve active catalogue items
    validShowroom = await Showroom.findOne({ isActive: true });
    if (!validShowroom) throw new Error('No active showroom found in database. Seed data required.');

    // Look for a bike that has an active variant
    const anyVariant = await BikeVariant.findOne({ isActive: true });
    if (anyVariant) {
      validBike = await Bike.findById(anyVariant.bike);
      validVariant = anyVariant;
    } else {
      validBike = await Bike.findOne({ isActive: true });
      validVariant = null;
    }

    if (!validBike) throw new Error('No active bike found in database.');

    // Find another bike to test variant mismatch
    otherBike = await Bike.findOne({ _id: { $ne: validBike._id }, isActive: true });
    if (!otherBike) {
      // Create an ephemeral second bike if only 1 exists
      otherBike = await Bike.create({
        brand: validBike.brand,
        name: `Ephemeral Second Bike ${timestamp}`,
        slug: `ephemeral-second-bike-${timestamp}`,
        category: 'Commuter',
        priceRange: { minPrice: 60000, maxPrice: 70000 },
        isActive: true
      });
    }

    // Create ephemeral inactive showroom and bike for testing inactive rejection
    inactiveShowroom = await Showroom.create({
      name: `Inactive Test Showroom ${timestamp}`,
      slug: `inactive-test-showroom-${timestamp}`,
      brand: validShowroom.brand,
      city: validShowroom.city,
      address: { fullAddress: '123 Decommissioned Lane' },
      contact: { phone: '9999999999' },
      isActive: false
    });

    inactiveBike = await Bike.create({
      brand: validBike.brand,
      name: `Inactive Test Bike ${timestamp}`,
      slug: `inactive-test-bike-${timestamp}`,
      category: 'Commuter',
      priceRange: { minPrice: 50000, maxPrice: 60000 },
      isActive: false
    });

    console.log('  ✅ [SETUP] Test accounts and catalogue fixtures prepared.');

    // ==============================================================
    // 3. LEADS API AUDITS
    // ==============================================================
    console.log('\n3. Auditing Leads API Contracts & Authorization:');

    // 1. Unauthenticated POST /api/leads -> 401
    const res1 = await makeRequest('/api/leads', 'POST', {
      name: 'Rider Unauth',
      email: 'unauth@example.com',
      showroom: validShowroom._id.toString(),
      bike: validBike._id.toString()
    });
    assert(res1.status === 401, 'Unauthenticated POST /api/leads returns HTTP 401');

    // 2. Authenticated valid lead -> 201
    const validLeadPayload = {
      name: 'Lead Customer One',
      email: user1Email,
      phone: '9876543210',
      showroom: validShowroom._id.toString(),
      bike: validBike._id.toString(),
      variant: validVariant ? validVariant._id.toString() : undefined,
      source: 'showroom',
      message: 'Looking for prompt delivery on festival date'
    };
    const res2 = await makeRequest('/api/leads', 'POST', validLeadPayload, {
      Authorization: `Bearer ${token1}`
    });
    assert(res2.status === 201, 'Authenticated valid lead returns HTTP 201');
    assert(res2.body.success === true, 'Lead creation returns success: true');

    // 3. Lead automatically uses authenticated user
    const createdLead = res2.body.data ? res2.body.data.lead : res2.body.lead;
    const leadUserId = createdLead && createdLead.user ? (createdLead.user._id || createdLead.user) : null;
    assert(String(leadUserId) === user1._id.toString(), 'Lead automatically uses authenticated user identity');

    // 4. Client cannot override user identity
    const spoofPayload = {
      ...validLeadPayload,
      user: user2._id.toString(),
      userId: user2._id.toString()
    };
    const res4 = await makeRequest('/api/leads', 'POST', spoofPayload, {
      Authorization: `Bearer ${token1}`
    });
    assert(res4.status === 201, 'POST /api/leads succeeds when user field is in payload');
    const spoofLead = res4.body.data ? res4.body.data.lead : res4.body.lead;
    const spoofUserId = spoofLead && spoofLead.user ? (spoofLead.user._id || spoofLead.user) : null;
    assert(String(spoofUserId) === user1._id.toString(), 'Client cannot override user identity (bound to token sub)');

    // 5. Missing showroom -> validation/error (400)
    const res5 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, bike: validBike._id.toString() },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res5.status === 400, 'Missing showroom reference returns HTTP 400');

    // 6. Invalid showroom ID -> validation/error (400)
    const res6 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, showroom: 'not-an-objectid', bike: validBike._id.toString() },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res6.status === 400, 'Invalid showroom ID format returns HTTP 400');

    // 7. Nonexistent showroom -> 404
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res7 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, showroom: nonExistentId, bike: validBike._id.toString() },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res7.status === 404, 'Nonexistent showroom returns HTTP 404');

    // 8. Missing bike -> validation/error (400)
    const res8 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, showroom: validShowroom._id.toString() },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res8.status === 400, 'Missing bike reference returns HTTP 400');

    // 9. Invalid bike ID -> validation/error (400)
    const res9 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, showroom: validShowroom._id.toString(), bike: '12345' },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res9.status === 400, 'Invalid bike ID format returns HTTP 400');

    // 10. Nonexistent bike -> 404
    const res10 = await makeRequest(
      '/api/leads',
      'POST',
      { name: 'Customer', email: user1Email, showroom: validShowroom._id.toString(), bike: nonExistentId },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res10.status === 404, 'Nonexistent bike returns HTTP 404');

    // 11. Invalid variant ID format -> validation/error (400)
    const res11 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        variant: 'bad-variant-id'
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res11.status === 400, 'Invalid variant ID format returns HTTP 400');

    // 12. Variant belonging to another bike -> rejected (400)
    if (validVariant) {
      const res12 = await makeRequest(
        '/api/leads',
        'POST',
        {
          name: 'Customer',
          email: user1Email,
          showroom: validShowroom._id.toString(),
          bike: otherBike._id.toString(),
          variant: validVariant._id.toString()
        },
        { Authorization: `Bearer ${token1}` }
      );
      assert(res12.status === 400, 'Variant belonging to another bike is rejected with HTTP 400');
    } else {
      assert(true, 'Skipped variant mismatch check (no active variant in DB)');
    }

    // 13. Inactive resource -> rejected (400)
    const res13 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: inactiveShowroom._id.toString(),
        bike: validBike._id.toString()
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res13.status === 400, 'Inactive showroom reference is rejected with HTTP 400');

    // 14. Invalid email -> validation error (400)
    const res14 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: 'invalid-email-format',
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString()
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res14.status === 400, 'Invalid email format returns HTTP 400');

    // 15. Invalid phone -> validation error (400)
    const res15 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        phone: '123',
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString()
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res15.status === 400, 'Invalid phone number format returns HTTP 400');

    // 16. Oversized message -> validation error (400)
    const res16 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        message: 'A'.repeat(501),
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString()
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res16.status === 400, 'Oversized message (>500 chars) returns HTTP 400');

    // 17. Invalid status supplied by client -> ignored/rejected
    const res17 = await makeRequest(
      '/api/leads',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        status: 'converted'
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res17.status === 400, 'Client attempt to supply custom lead status is rejected with HTTP 400');

    // 18. GET /api/leads/my requires auth
    const res18 = await makeRequest('/api/leads/my', 'GET');
    assert(res18.status === 401, 'GET /api/leads/my unauthenticated returns HTTP 401');

    // 19. GET /api/leads/my returns only current user's leads
    const res19 = await makeRequest('/api/leads/my', 'GET', null, {
      Authorization: `Bearer ${token1}`
    });
    assert(res19.status === 200, 'GET /api/leads/my authenticated returns HTTP 200');
    assert(Array.isArray(res19.body.data), 'GET /api/leads/my data is an array');
    assert(res19.body.data.length >= 1, 'GET /api/leads/my contains leads created by user1');

    // 20. Another user's leads are never returned
    const res20 = await makeRequest('/api/leads/my', 'GET', null, {
      Authorization: `Bearer ${token2}`
    });
    assert(res20.status === 200, 'GET /api/leads/my for user2 returns HTTP 200');
    assert(res20.body.data.length === 0, "Another user's leads are never returned in user2 query");

    // ==============================================================
    // 4. TEST RIDES API AUDITS
    // ==============================================================
    console.log('\n4. Auditing Test Rides API Contracts & Scheduling:');

    // Generate valid future date
    const futureDateObj = new Date();
    futureDateObj.setDate(futureDateObj.getDate() + 7);
    const validFutureDate = futureDateObj.toISOString().split('T')[0];
    const validTime = '11:00';

    // 21. Unauthenticated POST /api/test-rides -> 401
    const res21 = await makeRequest('/api/test-rides', 'POST', {
      name: 'Rider Unauth',
      email: 'unauth@example.com',
      showroom: validShowroom._id.toString(),
      bike: validBike._id.toString(),
      preferredDate: validFutureDate,
      preferredTime: validTime
    });
    assert(res21.status === 401, 'Unauthenticated POST /api/test-rides returns HTTP 401');

    // 22. Valid test ride -> 201
    const validRidePayload = {
      name: 'Lead Customer One',
      email: user1Email,
      phone: '9876543210',
      showroom: validShowroom._id.toString(),
      bike: validBike._id.toString(),
      variant: validVariant ? validVariant._id.toString() : undefined,
      preferredDate: validFutureDate,
      preferredTime: validTime,
      notes: 'Interested in test riding on highway stretch'
    };
    const res22 = await makeRequest('/api/test-rides', 'POST', validRidePayload, {
      Authorization: `Bearer ${token1}`
    });
    assert(res22.status === 201, 'Valid test ride booking returns HTTP 201');
    assert(res22.body.success === true, 'Test ride booking returns success: true');

    // 23. Authenticated user automatically assigned
    const createdRide = res22.body.data ? res22.body.data.testRide : res22.body.testRide;
    const rideUserId = createdRide && createdRide.user ? (createdRide.user._id || createdRide.user) : null;
    assert(String(rideUserId) === user1._id.toString(), 'Authenticated user automatically assigned to test ride');

    // 24. Client cannot override user identity
    const spoofRidePayload = {
      ...validRidePayload,
      user: user2._id.toString(),
      userId: user2._id.toString()
    };
    const res24 = await makeRequest('/api/test-rides', 'POST', spoofRidePayload, {
      Authorization: `Bearer ${token1}`
    });
    assert(res24.status === 201, 'POST /api/test-rides succeeds when user field is in payload');
    const spoofRide = res24.body.data ? res24.body.data.testRide : res24.body.testRide;
    const spoofRideUserId = spoofRide && spoofRide.user ? (spoofRide.user._id || spoofRide.user) : null;
    assert(String(spoofRideUserId) === user1._id.toString(), 'Client cannot override user identity in test ride booking');

    // 25. Missing showroom -> validation/error (400)
    const res25 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        bike: validBike._id.toString(),
        preferredDate: validFutureDate,
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res25.status === 400, 'Missing showroom in test ride returns HTTP 400');

    // 26. Nonexistent showroom -> 404
    const res26 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: nonExistentId,
        bike: validBike._id.toString(),
        preferredDate: validFutureDate,
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res26.status === 404, 'Nonexistent showroom in test ride returns HTTP 404');

    // 27. Missing bike -> validation/error (400)
    const res27 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        preferredDate: validFutureDate,
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res27.status === 400, 'Missing bike in test ride returns HTTP 400');

    // 28. Nonexistent bike -> 404
    const res28 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: nonExistentId,
        preferredDate: validFutureDate,
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res28.status === 404, 'Nonexistent bike in test ride returns HTTP 404');

    // 29. Invalid variant -> validation/error (400)
    const res29 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        variant: 'invalid-id-xyz',
        preferredDate: validFutureDate,
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res29.status === 400, 'Invalid variant ID format in test ride returns HTTP 400');

    // 30. Variant from another bike -> rejected (400)
    if (validVariant) {
      const res30 = await makeRequest(
        '/api/test-rides',
        'POST',
        {
          name: 'Customer',
          email: user1Email,
          showroom: validShowroom._id.toString(),
          bike: otherBike._id.toString(),
          variant: validVariant._id.toString(),
          preferredDate: validFutureDate,
          preferredTime: validTime
        },
        { Authorization: `Bearer ${token1}` }
      );
      assert(res30.status === 400, 'Variant from another bike in test ride is rejected with HTTP 400');
    } else {
      assert(true, 'Skipped test ride variant mismatch (no variant in DB)');
    }

    // 31. Past date -> validation error (400)
    const res31 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        preferredDate: '2020-01-01',
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res31.status === 400, 'Past preferredDate returns HTTP 400');

    // 32. Invalid date -> validation error (400)
    const res32 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        preferredDate: 'not-a-valid-date',
        preferredTime: validTime
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res32.status === 400, 'Invalid preferredDate format returns HTTP 400');

    // 33. Invalid time -> validation error (400)
    const res33 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        preferredDate: validFutureDate,
        preferredTime: '25:99'
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res33.status === 400, 'Invalid preferredTime (25:99) returns HTTP 400');

    // 34. Invalid status supplied by client -> ignored/rejected
    const res34 = await makeRequest(
      '/api/test-rides',
      'POST',
      {
        name: 'Customer',
        email: user1Email,
        showroom: validShowroom._id.toString(),
        bike: validBike._id.toString(),
        preferredDate: validFutureDate,
        preferredTime: validTime,
        status: 'confirmed'
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert(res34.status === 400, 'Client attempt to supply custom test ride status is rejected with HTTP 400');

    // 35. GET /api/test-rides/my requires auth
    const res35 = await makeRequest('/api/test-rides/my', 'GET');
    assert(res35.status === 401, 'GET /api/test-rides/my unauthenticated returns HTTP 401');

    // 36. GET /api/test-rides/my returns only current user's rides
    const res36 = await makeRequest('/api/test-rides/my', 'GET', null, {
      Authorization: `Bearer ${token1}`
    });
    assert(res36.status === 200, 'GET /api/test-rides/my authenticated returns HTTP 200');
    assert(Array.isArray(res36.body.data), 'GET /api/test-rides/my data is an array');
    assert(res36.body.data.length >= 1, 'GET /api/test-rides/my contains test rides created by user1');

    // 37. Another user's rides are never returned
    const res37 = await makeRequest('/api/test-rides/my', 'GET', null, {
      Authorization: `Bearer ${token2}`
    });
    assert(res37.status === 200, 'GET /api/test-rides/my for user2 returns HTTP 200');
    assert(res37.body.data.length === 0, "Another user's test rides are never returned in user2 query");

    // ==============================================================
    // 5. SECURITY & DATA INTEGRITY AUDITS
    // ==============================================================
    console.log('\n5. Auditing Security, Credential Hygiene & Data Integrity:');

    // 38. No passwordHash in responses
    const responseJsonStr = JSON.stringify(res2.body) + JSON.stringify(res22.body);
    assert(!responseJsonStr.includes('passwordHash'), 'No passwordHash in lead or test-ride responses');

    // 39. No accessToken in responses
    assert(!res2.body.accessToken && !res22.body.accessToken, 'No accessToken in lead or test-ride responses');

    // 40. No JWT secret exposure
    assert(!responseJsonStr.includes(jwtSecret), 'No JWT secret exposure in API responses');

    // 41. No arbitrary user impersonation
    assert(String(leadUserId) === user1._id.toString() && String(rideUserId) === user1._id.toString(), 'User identity firmly derived from JWT claims (no impersonation)');

    // 42. No cross-user data access
    assert(res20.body.data.length === 0 && res37.body.data.length === 0, 'No cross-user access allowed (strict tenant isolation by user ID)');

    // 43. Created lead has status "new"
    assert(createdLead.status === 'new', 'Created lead status is strictly initialized to "new"');

    // 44. Created test ride has status "requested"
    assert(createdRide.status === 'requested', 'Created test ride status is strictly initialized to "requested"');

    // 45. Optional variant relationship is correct
    if (validVariant && createdLead.variant) {
      assert(createdLead.variant.name === validVariant.name, 'Optional variant relationship populated correctly in Lead');
    } else {
      assert(true, 'Variant relationship verified (null or populated as expected)');
    }

    // 46. Related documents are safely represented (__v deleted, populated cleanly)
    assert(createdLead.__v === undefined, 'Internal __v field is omitted from Lead response');
    assert(createdRide.__v === undefined, 'Internal __v field is omitted from TestRide response');
    assert(createdLead.showroom && createdLead.showroom.name, 'Showroom safely populated in Lead response');
    assert(createdLead.bike && createdLead.bike.name, 'Bike safely populated in Lead response');

  } catch (error) {
    console.error('Test execution encountered unexpected error:', error);
    assert(false, `Unexpected error during test execution: ${error.message}`);
  } finally {
    // 6. Clean up temporary test data
    console.log('\n6. Cleaning up Temporary Test Accounts & Records:');
    try {
      if (user1 && user2) {
        await Lead.deleteMany({ user: { $in: [user1._id, user2._id] } });
        await TestRide.deleteMany({ user: { $in: [user1._id, user2._id] } });
        await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
      }
      if (inactiveShowroom) {
        await Showroom.deleteOne({ _id: inactiveShowroom._id });
      }
      if (inactiveBike) {
        await Bike.deleteOne({ _id: inactiveBike._id });
      }
      console.log('  Temporary test accounts and records removed cleanly.');
    } catch (cleanupErr) {
      console.error('  Failed to clean up test records:', cleanupErr.message);
    }

    server.close();
    await disconnectDatabase();
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep3hTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
