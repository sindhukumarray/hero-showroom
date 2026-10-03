const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Showroom, Bike, Brand, City } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');
const errorHandler = require('./src/middleware/errorHandler');

async function runStep5bReliabilityTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 2 API RELIABILITY & ERROR AUDIT   ');
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
  console.log('1. Verifying Database Connection:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Reliability & Error-Handling verification');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Reliability test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body !== null) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const headers = {
        'Content-Type': 'application/json',
        'x-test-bypass': 'true',
        ...extraHeaders
      };
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: pathUrl,
          method,
          headers
        },
        (res) => {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
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
              rawBody: rawData
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

  // 3. Prepare test users and JWT tokens
  console.log('\n3. Preparing Test Security Tokens:');
  const secret = authConfig.getJwtSecret();

  // Find or create admin
  let adminUser = await User.findOne({ role: ROLES.ADMIN });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@12345', salt);
    adminUser = await User.create({
      name: 'er_sindhu',
      email: 'admin_test_step5b@heroshowroom.local',
      passwordHash,
      role: ROLES.ADMIN,
      phone: '9876543210'
    });
  }

  // Find or create customer
  let customerUser = await User.findOne({ role: ROLES.CUSTOMER });
  if (!customerUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Customer@12345', salt);
    customerUser = await User.create({
      name: 'Test Customer',
      email: 'customer_test_step5b@heroshowroom.local',
      passwordHash,
      role: ROLES.CUSTOMER,
      phone: '9876543211'
    });
  }

  const adminToken = jwt.sign({ sub: adminUser._id.toString(), role: ROLES.ADMIN }, secret, {
    expiresIn: '1h'
  });
  const customerToken = jwt.sign({ sub: customerUser._id.toString(), role: ROLES.CUSTOMER }, secret, {
    expiresIn: '1h'
  });
  const expiredToken = jwt.sign({ sub: customerUser._id.toString(), role: ROLES.CUSTOMER }, secret, {
    expiresIn: '-10s'
  });

  assert(Boolean(adminToken), 'Admin test JWT generated');
  assert(Boolean(customerToken), 'Customer test JWT generated');

  // 4. Test 1: Unknown Routes Return Safe 404
  console.log('\n4. Testing Unknown Route Handling (404 Not Found):');
  const unknownApiRes = await makeRequest('/api/completely-unknown-route-xyz');
  assert(unknownApiRes.statusCode === 404, 'Unknown /api route returns HTTP 404');
  assert(unknownApiRes.body && unknownApiRes.body.success === false, 'Unknown route response contract has success: false');
  assert(unknownApiRes.body && unknownApiRes.body.message.includes('Route not found'), 'Unknown route message indicates route not found');
  assert(Array.isArray(unknownApiRes.body && unknownApiRes.body.errors), 'Unknown route returns errors array');

  const unknownRootRes = await makeRequest('/non-existent-root-path-12345');
  assert(unknownRootRes.statusCode === 404, 'Unknown root route returns HTTP 404');
  assert(unknownRootRes.body && unknownRootRes.body.success === false, 'Unknown root route has success: false');

  const unknownMethodRes = await makeRequest('/api/health', 'DELETE');
  assert(unknownMethodRes.statusCode === 404, 'Unsupported HTTP method on endpoint returns HTTP 404');

  // 5. Test 2: Malformed JSON Returns Safe 400
  console.log('\n5. Testing Malformed JSON Payload Handling (400 Bad Request):');
  const malformedJsonRes = await makeRequest('/api/auth/login', 'POST', '{"email": "broken-json, missing-end');
  assert(malformedJsonRes.statusCode === 400, 'Malformed JSON payload returns HTTP 400');
  assert(malformedJsonRes.body && malformedJsonRes.body.success === false, 'Malformed JSON response contract has success: false');
  assert(
    malformedJsonRes.body && malformedJsonRes.body.message.includes('Malformed JSON payload'),
    'Malformed JSON returns clear, normalized message'
  );
  assert(
    malformedJsonRes.body && !malformedJsonRes.rawBody.includes('SyntaxError:'),
    'Malformed JSON does not leak raw engine SyntaxError traces'
  );

  // 6. Test 3: Validation Failure Returns Expected 4xx
  console.log('\n6. Testing Input Validation Error Consistency (400 Bad Request):');
  const invalidRegisterRes = await makeRequest('/api/auth/register', 'POST', {
    name: '',
    email: 'not-an-email',
    password: '123'
  });
  assert(invalidRegisterRes.statusCode === 400, 'Invalid registration payload returns HTTP 400');
  assert(invalidRegisterRes.body && invalidRegisterRes.body.success === false, 'Validation failure has success: false');
  assert(
    invalidRegisterRes.body && Array.isArray(invalidRegisterRes.body.errors) && invalidRegisterRes.body.errors.length > 0,
    'Validation failure returns structured list of specific field errors'
  );

  const invalidShowroomQuery = await makeRequest('/api/showrooms?sort=invalidSortField');
  assert(invalidShowroomQuery.statusCode === 400, 'Invalid query parameter returns HTTP 400');
  assert(invalidShowroomQuery.body && invalidShowroomQuery.body.success === false, 'Invalid query has success: false');

  // 7. Test 4: Invalid ObjectId Handling (Safe 400 vs 404)
  console.log('\n7. Testing Invalid ObjectId vs Non-Existent Resource Handling:');
  const invalidObjectIdRes = await makeRequest('/api/admin/bikes/not-a-valid-object-id', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(invalidObjectIdRes.statusCode === 400, 'Malformed ObjectId parameter returns HTTP 400');
  assert(invalidObjectIdRes.body && invalidObjectIdRes.body.success === false, 'Malformed ObjectId has success: false');
  assert(
    invalidObjectIdRes.body &&
      (invalidObjectIdRes.body.message.includes('Invalid') || invalidObjectIdRes.body.message.includes('ObjectId')),
    'Malformed ObjectId returns clear explanation without 500 crash'
  );

  // Direct Mongoose CastError test in errorHandler
  let castResStatus = null;
  let castResBody = null;
  const mockCastRes = {
    statusCode: 200,
    status(code) {
      castResStatus = code;
      return this;
    },
    json(payload) {
      castResBody = payload;
      return this;
    }
  };
  const mockCastErr = {
    name: 'CastError',
    path: '_id',
    value: 'not-an-id'
  };
  errorHandler(mockCastErr, { method: 'GET', originalUrl: '/api/admin/bikes/not-an-id' }, mockCastRes, () => {});
  assert(castResStatus === 400, 'Mongoose CastError directly maps to HTTP 400 Bad Request');
  assert(castResBody && castResBody.success === false, 'CastError response has success: false');
  assert(
    castResBody && castResBody.message.includes('Expected a valid ObjectId'),
    'CastError response explains invalid format'
  );

  const nonExistentObjectId = '507f1f77bcf86cd799439011'; // valid 24 hex chars, but does not exist
  const missingBikeRes = await makeRequest(`/api/admin/bikes/${nonExistentObjectId}`, 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(missingBikeRes.statusCode === 404, 'Valid format but non-existent resource returns HTTP 404');
  assert(missingBikeRes.body && missingBikeRes.body.success === false, 'Missing resource response has success: false');
  assert(missingBikeRes.body && missingBikeRes.body.message.includes('not found'), 'Missing resource indicates not found');

  // 8. Test 5: Duplicate Key Error Normalization (409 Conflict)
  console.log('\n8. Testing Duplicate Key Error Handling (409 Conflict):');
  // Unit test errorHandler directly with simulated Mongo 11000 duplicate key error
  let duplicateResStatus = null;
  let duplicateResBody = null;
  const mockRes = {
    statusCode: 200,
    status(code) {
      duplicateResStatus = code;
      return this;
    },
    json(payload) {
      duplicateResBody = payload;
      return this;
    }
  };
  const mockDuplicateErr = {
    code: 11000,
    codeName: 'DuplicateKey',
    keyValue: { slug: 'hero-splendor-plus' }
  };
  errorHandler(mockDuplicateErr, { method: 'POST', originalUrl: '/api/admin/bikes' }, mockRes, () => {});
  assert(duplicateResStatus === 409, 'Mongo 11000 duplicate key error maps to HTTP 409 Conflict');
  assert(duplicateResBody && duplicateResBody.success === false, 'Duplicate key error response has success: false');
  assert(
    duplicateResBody && duplicateResBody.message.includes('slug already exists'),
    'Duplicate key error message clearly identifies duplicate field'
  );
  assert(
    duplicateResBody && duplicateResBody.errors[0].includes('Duplicate key constraint violation'),
    'Duplicate key error details populated in errors array'
  );

  // 9. Test 6: Unauthorized Requests (401 Unauthorized)
  console.log('\n9. Testing Authentication Failure Handling (401 Unauthorized):');
  const unauthenticatedRes = await makeRequest('/api/auth/me');
  assert(unauthenticatedRes.statusCode === 401, 'Request to protected route without token returns HTTP 401');
  assert(unauthenticatedRes.body && unauthenticatedRes.body.success === false, 'Unauthenticated response has success: false');

  const malformedTokenRes = await makeRequest('/api/auth/me', 'GET', null, {
    Authorization: 'Bearer invalid.token.signature'
  });
  assert(malformedTokenRes.statusCode === 401, 'Request with forged/malformed token returns HTTP 401');

  const expiredTokenRes = await makeRequest('/api/auth/me', 'GET', null, {
    Authorization: `Bearer ${expiredToken}`
  });
  assert(expiredTokenRes.statusCode === 401, 'Request with expired token returns HTTP 401');

  // 10. Test 7: Forbidden Requests (403 Forbidden)
  console.log('\n10. Testing Authorization Failure Handling (403 Forbidden):');
  const forbiddenDashboardRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(forbiddenDashboardRes.statusCode === 403, 'Customer accessing admin dashboard returns HTTP 403 Forbidden');
  assert(forbiddenDashboardRes.body && forbiddenDashboardRes.body.success === false, 'Forbidden response has success: false');
  assert(forbiddenDashboardRes.body && forbiddenDashboardRes.body.message === 'Forbidden', 'Forbidden message is standardized');

  const forbiddenBikesRes = await makeRequest('/api/admin/bikes', 'GET', null, {
    Authorization: `Bearer ${customerToken}`
  });
  assert(forbiddenBikesRes.statusCode === 403, 'Customer accessing admin bikes returns HTTP 403');

  // 11. Test 8: Missing Public Resources Return 404
  console.log('\n11. Testing Missing Public Resources (404 Not Found):');
  const missingPublicBike = await makeRequest('/api/bikes/this-bike-slug-definitely-does-not-exist');
  assert(missingPublicBike.statusCode === 404, 'Non-existent public bike slug returns HTTP 404');
  assert(missingPublicBike.body && missingPublicBike.body.success === false, 'Missing bike has success: false');

  const missingPublicShowroom = await makeRequest('/api/showrooms/this-showroom-slug-definitely-does-not-exist');
  assert(missingPublicShowroom.statusCode === 404, 'Non-existent public showroom slug returns HTTP 404');
  assert(missingPublicShowroom.body && missingPublicShowroom.body.success === false, 'Missing showroom has success: false');

  // 12. Test 9 & 10: Unexpected Server Error & Production Secret Sanitization (500)
  console.log('\n12. Testing Unexpected Server Error & Production Secret Sanitization:');
  const savedNodeEnv = process.env.NODE_ENV;

  // Test in simulated production environment
  process.env.NODE_ENV = 'production';
  let prodErrStatus = null;
  let prodErrBody = null;
  const mockProdRes = {
    statusCode: 200,
    status(code) {
      prodErrStatus = code;
      return this;
    },
    json(payload) {
      prodErrBody = payload;
      return this;
    }
  };
  const mockInternalErr = new Error('Database password failed for mongodb://admin:secret123@cluster0.mongodb.net/prod');
  errorHandler(mockInternalErr, { method: 'GET', originalUrl: '/api/bikes' }, mockProdRes, () => {});

  assert(prodErrStatus === 500, 'Unhandled internal error maps to HTTP 500');
  assert(prodErrBody && prodErrBody.success === false, 'Production 500 has success: false');
  assert(
    prodErrBody && prodErrBody.message === 'Internal Server Error',
    'Production 500 completely masks internal exception message'
  );
  assert(
    prodErrBody && Array.isArray(prodErrBody.errors) && prodErrBody.errors.length === 0,
    'Production 500 suppresses all stack traces and internal errors'
  );
  assert(
    !JSON.stringify(prodErrBody).includes('secret123'),
    'Production 500 completely prevents leaking database passwords/URIs'
  );

  // Test in development environment
  process.env.NODE_ENV = 'development';
  let devErrStatus = null;
  let devErrBody = null;
  const mockDevRes = {
    statusCode: 200,
    status(code) {
      devErrStatus = code;
      return this;
    },
    json(payload) {
      devErrBody = payload;
      return this;
    }
  };
  errorHandler(mockInternalErr, { method: 'GET', originalUrl: '/api/bikes' }, mockDevRes, () => {});
  assert(devErrStatus === 500, 'Development 500 maps to HTTP 500');
  assert(
    devErrBody && Array.isArray(devErrBody.errors) && devErrBody.errors.length > 0 && Boolean(devErrBody.errors[0].stack),
    'Development 500 provides stack traces for developer debugging'
  );

  // Restore NODE_ENV
  process.env.NODE_ENV = savedNodeEnv;

  // 13. Test 11: Request Payload Too Large (413)
  console.log('\n13. Testing Request Payload Size Enforcement (413):');
  const oversizedData = 'x'.repeat(1.2 * 1024 * 1024); // 1.2MB payload
  const oversizedRes = await makeRequest('/api/auth/login', 'POST', { padding: oversizedData });
  assert(oversizedRes.statusCode === 413, 'Oversized payload (>1MB) returns HTTP 413 Payload Too Large');
  assert(oversizedRes.body && oversizedRes.body.success === false, '413 response has success: false');
  assert(
    oversizedRes.body && oversizedRes.body.message.includes('exceeds maximum allowable size limit'),
    '413 response returns clear size limit explanation'
  );

  // 14. Test 12: Rate Limiting Remains Functional
  console.log('\n14. Testing Rate Limiting Behavior:');
  const rateLimitProbe = await makeRequest('/api/health', 'GET', null, {
    'x-test-bypass': 'false',
    'x-force-rate-limit': 'true'
  });
  assert(
    rateLimitProbe.headers['ratelimit-limit'] !== undefined,
    'Rate limit headers (RateLimit-Limit) present on active rate-limited requests'
  );
  assert(
    rateLimitProbe.headers['ratelimit-remaining'] !== undefined,
    'Rate limit headers (RateLimit-Remaining) present'
  );
  assert(
    rateLimitProbe.headers['ratelimit-reset'] !== undefined,
    'Rate limit headers (RateLimit-Reset) present'
  );

  // 15. Test 13: Health Endpoint Remains Available
  console.log('\n15. Testing Health Endpoint Availability:');
  const healthRes = await makeRequest('/api/health');
  assert(healthRes.statusCode === 200, 'Health check returns HTTP 200 OK');
  assert(healthRes.body && healthRes.body.success === true, 'Health check has success: true');
  assert(
    healthRes.body && healthRes.body.data && healthRes.body.data.database === 'connected',
    'Health check indicates database connected'
  );

  // 16. Test 14: Existing API Response Contracts Remain Intact
  console.log('\n16. Testing Existing Public API Contracts:');
  const bikesRes = await makeRequest('/api/bikes?limit=5');
  assert(bikesRes.statusCode === 200, 'Public bikes catalogue returns HTTP 200');
  assert(bikesRes.body && bikesRes.body.success === true, 'Bikes response has success: true');
  assert(Array.isArray(bikesRes.body && bikesRes.body.data), 'Bikes response data is an array');
  assert(
    bikesRes.body && bikesRes.body.meta && typeof bikesRes.body.meta.total === 'number',
    'Bikes response includes pagination metadata'
  );

  const brandsRes = await makeRequest('/api/brands');
  assert(brandsRes.statusCode === 200, 'Public brands returns HTTP 200');
  assert(Array.isArray(brandsRes.body && brandsRes.body.data), 'Brands data is an array');

  const citiesRes = await makeRequest('/api/cities');
  assert(citiesRes.statusCode === 200, 'Public cities returns HTTP 200');
  assert(Array.isArray(citiesRes.body && citiesRes.body.data), 'Cities data is an array');

  const showroomsRes = await makeRequest('/api/showrooms?limit=5');
  assert(showroomsRes.statusCode === 200, 'Public showrooms returns HTTP 200');
  assert(Array.isArray(showroomsRes.body && showroomsRes.body.data), 'Showrooms data is an array');

  const rootRes = await makeRequest('/');
  assert(rootRes.statusCode === 200, 'Root / check returns HTTP 200');
  assert(rootRes.body && rootRes.body.success === true, 'Root check has success: true');

  // 17. Test 15: Admin Session Verification Contract
  console.log('\n17. Testing Admin Foundation Contract:');
  const adminStatusRes = await makeRequest('/api/admin/status', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(adminStatusRes.statusCode === 200, 'Admin status returns HTTP 200');
  assert(
    adminStatusRes.body &&
      adminStatusRes.body.data &&
      adminStatusRes.body.data.admin &&
      adminStatusRes.body.data.admin.role === ROLES.ADMIN,
    'Admin status verifies admin role'
  );

  // Direct Mongoose ValidationError test in errorHandler
  let validationResStatus = null;
  let validationResBody = null;
  const mockValidationRes = {
    statusCode: 200,
    status(code) {
      validationResStatus = code;
      return this;
    },
    json(payload) {
      validationResBody = payload;
      return this;
    }
  };
  const mockValidationErr = {
    name: 'ValidationError',
    errors: {
      title: { message: 'Title is required.', path: 'title' },
      price: { message: 'Price must be positive.', path: 'price' }
    }
  };
  errorHandler(mockValidationErr, { method: 'POST', originalUrl: '/api/bikes' }, mockValidationRes, () => {});
  assert(validationResStatus === 400, 'Mongoose ValidationError maps to HTTP 400 Bad Request');
  assert(validationResBody && validationResBody.success === false, 'ValidationError response has success: false');
  assert(
    validationResBody && validationResBody.errors.includes('Title is required.'),
    'ValidationError extracts field-specific error messages'
  );

  const adminDashboardRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(adminDashboardRes.statusCode === 200, 'Admin dashboard returns HTTP 200');
  assert(
    adminDashboardRes.body && adminDashboardRes.body.data && adminDashboardRes.body.data.overview !== undefined,
    'Admin dashboard returns metrics aggregation'
  );

  // 18. Teardown
  console.log('\n18. Teardown Ephemeral Test Server:');
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  assert(true, 'Test server closed and database disconnected cleanly');

  // Summary
  console.log('\n================================================================');
  console.log(` AUDIT & TEST RESULT: ${passed} / ${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep5bReliabilityTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = runStep5bReliabilityTests;
