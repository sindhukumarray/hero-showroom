const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Showroom, Bike } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');
const { createRateLimiter } = require('./src/middleware/rateLimiter');

async function runStep5aSecurityTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 1 PRODUCTION SECURITY AUDIT      ');
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
    assert(isConnected(), 'Database connected successfully for Security Hardening testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Live security test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body !== null) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }
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
            let parsed = null;
            try {
              parsed = JSON.parse(resData);
            } catch (e) {
              // raw text
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsed,
              raw: resData
            });
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

  const testPrefix = `test-sec-${Date.now()}`;
  const customerEmail = `${testPrefix}-cust@heroshowroom.example.com`;
  const adminEmail = `${testPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminPass123!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  const createdUserIds = [];

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

    // ============================================================
    // Test 1: Server health remains available
    // ============================================================
    console.log('\n3. Server Health & Root Routing:');
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthRes.data?.success === true, 'Health payload indicates success: true');
    assert(healthRes.data?.data?.database === 'connected', 'Health payload confirms database: connected');

    const rootRes = await makeRequest('/');
    assert(rootRes.status === 200, 'GET / root welcome route responds with 200 OK');

    // ============================================================
    // Test 2: HTTP Security Headers
    // ============================================================
    console.log('\n4. HTTP Security Headers Verification:');
    const headers = healthRes.headers;
    assert(headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assert(headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');
    assert(headers['x-xss-protection'] === '0', 'X-XSS-Protection is 0 (modern standard)');
    assert(headers['x-permitted-cross-domain-policies'] === 'none', 'X-Permitted-Cross-Domain-Policies is none');
    assert(headers['x-dns-prefetch-control'] === 'off', 'X-DNS-Prefetch-Control is off');
    assert(Boolean(headers['content-security-policy']), 'Content-Security-Policy header is configured');
    assert(headers['content-security-policy']?.includes("frame-ancestors 'self'"), 'CSP includes frame-ancestors directive');
    assert(!headers['x-powered-by'], 'X-Powered-By header is removed / not present');

    // ============================================================
    // Test 3: CORS Behavior
    // ============================================================
    console.log('\n5. CORS Allowed Origin Strategy:');
    // Trusted Origin
    const trustedCorsRes = await makeRequest('/api/health', 'GET', null, {
      Origin: 'http://localhost:5173'
    });
    assert(trustedCorsRes.headers['access-control-allow-origin'] === 'http://localhost:5173', 'Trusted origin receives matching Access-Control-Allow-Origin');
    assert(trustedCorsRes.headers['access-control-allow-credentials'] === 'true', 'Access-Control-Allow-Credentials is true for trusted origin');

    // Preflight OPTIONS Request
    const preflightRes = await makeRequest('/api/auth/login', 'OPTIONS', null, {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    });
    assert(preflightRes.status === 204 || preflightRes.status === 200, 'CORS preflight request succeeds (204/200)');
    assert(Boolean(preflightRes.headers['access-control-allow-methods']), 'Preflight returns Access-Control-Allow-Methods');

    // Untrusted Origin
    const untrustedCorsRes = await makeRequest('/api/health', 'GET', null, {
      Origin: 'http://malicious-attacker-site.com'
    });
    assert(
      untrustedCorsRes.headers['access-control-allow-origin'] !== 'http://malicious-attacker-site.com' &&
      untrustedCorsRes.headers['access-control-allow-origin'] !== '*',
      'Untrusted origin is rejected or not granted wildcard/matching access'
    );

    // ============================================================
    // Test 4: Request Size Protection (1MB Limit)
    // ============================================================
    console.log('\n6. Request Body Size Flood Protection:');
    // Create an oversized payload > 1MB (e.g. 1.2MB of repetitive data)
    const largePayload = {
      title: 'Oversized Spam Lead',
      comment: 'A'.repeat(1.2 * 1024 * 1024)
    };
    const oversizeRes = await makeRequest('/api/leads', 'POST', largePayload, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(oversizeRes.status === 413, `Payload exceeding 1MB is rejected with HTTP 413 (got ${oversizeRes.status})`);
    assert(oversizeRes.data?.success === false, 'Oversized payload rejection includes success: false');

    // ============================================================
    // Test 5: Authentication Endpoint Protection
    // ============================================================
    console.log('\n7. Authentication Endpoint Credentials Handling:');
    // Valid login
    const validLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: customerEmail,
      password: testPassword
    });
    assert(validLoginRes.status === 200, 'Valid login returns HTTP 200');
    assert(Boolean(validLoginRes.data?.data?.accessToken), 'Login response contains accessToken');

    // Bad password
    const badLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: customerEmail,
      password: 'WrongPassword123!'
    });
    assert(badLoginRes.status === 401, 'Bad credentials rejected with HTTP 401');
    assert(badLoginRes.data?.success === false, 'Bad credentials returns success: false');

    // Non-existent email
    const nonExistentLogin = await makeRequest('/api/auth/login', 'POST', {
      email: `nonexistent-${Date.now()}@heroshowroom.example.com`,
      password: testPassword
    });
    assert(nonExistentLogin.status === 401, 'Non-existent email login returns generic 401 without user enumeration');

    // ============================================================
    // Test 6: Invalid JWT Rejection
    // ============================================================
    console.log('\n8. JWT Cryptographic & Format Validation:');
    const invalidJwtRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: 'Bearer invalid.tampered.token.here'
    });
    assert(invalidJwtRes.status === 401, 'Tampered / invalid JWT rejected with HTTP 401');
    assert(invalidJwtRes.data?.message === 'Invalid or expired token', 'Invalid JWT returns generic error without leaking internals');

    const noBearerRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: 'Basic dXNlcjpwYXNz'
    });
    assert(noBearerRes.status === 401, 'Non-Bearer authentication scheme rejected with HTTP 401');

    // ============================================================
    // Test 7: Expired JWT Rejection
    // ============================================================
    console.log('\n9. Expired JWT Rejection:');
    const expiredToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: -10 } // Expired 10 seconds ago
    );
    const expiredRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${expiredToken}`
    });
    assert(expiredRes.status === 401, 'Expired JWT rejected with HTTP 401');
    assert(expiredRes.data?.message === 'Invalid or expired token', 'Expired JWT returns sanitized error message');

    // ============================================================
    // Test 8: Non-Admin / Customer Cannot Access Admin Endpoint (403)
    // ============================================================
    console.log('\n10. RBAC Authorization Boundaries:');
    const customerAdminRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerAdminRes.status === 403, 'Customer token accessing /api/admin/dashboard rejected with 403 Forbidden');
    assert(customerAdminRes.data?.message === 'Forbidden', '403 Forbidden message returned');

    const customerBrandAdminRes = await makeRequest('/api/admin/brands', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerBrandAdminRes.status === 403, 'Customer token accessing /api/admin/brands rejected with 403 Forbidden');

    // ============================================================
    // Test 9: Admin Can Access Admin Endpoint (200)
    // ============================================================
    const adminDashboardRes = await makeRequest('/api/admin/dashboard', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminDashboardRes.status === 200, 'Admin token accessing /api/admin/dashboard returns 200 OK');
    assert(adminDashboardRes.data?.success === true, 'Admin dashboard returns success: true');

    // ============================================================
    // Test 10: MongoDB Operator Injection Protection ($gt, $ne, $where)
    // ============================================================
    console.log('\n11. MongoDB Operator Injection Defenses:');
    // In query params
    const operatorQueryRes = await makeRequest('/api/brands?name[$gt]=', 'GET');
    assert(operatorQueryRes.status === 400, 'Operator injection in query parameters ($gt) rejected with 400');
    assert(operatorQueryRes.data?.success === false, 'Operator injection query returns success: false');

    const whereQueryRes = await makeRequest('/api/showrooms?$where=sleep(5000)', 'GET');
    assert(whereQueryRes.status === 400, 'JavaScript injection ($where) in query rejected with 400');

    // In JSON body
    const operatorBodyRes = await makeRequest('/api/leads', 'POST', {
      name: { $gt: '' },
      email: 'test@example.com'
    }, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(operatorBodyRes.status === 400, 'Operator injection in JSON body ($gt) rejected with 400');

    // ============================================================
    // Test 11: Dot-Notation Property Path Injection
    // ============================================================
    console.log('\n12. Dot-Notation Property Path Injection Defenses:');
    const dotQueryRes = await makeRequest('/api/bikes?user.role=admin', 'GET');
    assert(dotQueryRes.status === 400, 'Dot-notation query injection (user.role) rejected with 400');

    const dotBodyRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'er_sindhu Dot',
      email: 'testdot@example.com',
      password: testPassword,
      'address.street': 'Main St'
    });
    assert(dotBodyRes.status === 400, 'Dot-notation in JSON body rejected with 400');

    // ============================================================
    // Test 12: Unsafe Sort Parameter Protection
    // ============================================================
    console.log('\n13. Unsafe Sort Parameter Whitelist Defenses:');
    const unsafeSortRes = await makeRequest('/api/bikes?sort=passwordHash', 'GET');
    assert(unsafeSortRes.status === 400, 'Unwhitelisted sort field (passwordHash) rejected with 400');

    const validSortRes = await makeRequest('/api/bikes?sort=priceLow', 'GET');
    assert(validSortRes.status === 200, 'Whitelisted sort field (priceLow) accepted with 200');

    // ============================================================
    // Test 13: Invalid ObjectId Parameter Protection
    // ============================================================
    console.log('\n14. Invalid ObjectId Validation:');
    const invalidIdRes = await makeRequest('/api/admin/brands/not-a-valid-object-id', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(invalidIdRes.status === 400, 'Malformed ObjectId parameter rejected with 400');

    // ============================================================
    // Test 14: Search Regex Sanitization (No ReDoS / Unhandled Regex)
    // ============================================================
    console.log('\n15. Search Regex Special Characters Sanitization:');
    // Dangerous regex characters: (.*)+, ^$, [], {1,9999}
    const regexRes = await makeRequest('/api/bikes?search=(.*a)+', 'GET');
    assert(regexRes.status === 200, 'Potentially catastrophic regex string in search handled safely with 200');
    assert(Array.isArray(regexRes.data?.data), 'Returns standard bike array without server crash');

    const bracketRegexRes = await makeRequest('/api/showrooms?search=[[[[', 'GET');
    assert(bracketRegexRes.status === 200, 'Unclosed regex brackets in search handled safely without crash');

    // ============================================================
    // Test 15: Sensitive Field Redaction
    // ============================================================
    console.log('\n16. Sensitive Field Redaction & Leakage Audit:');
    const meRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    const meStr = JSON.stringify(meRes.data);
    assert(!meStr.includes('passwordHash'), 'User profile response omits passwordHash');
    assert(!meStr.includes('password"'), 'User profile response omits raw password');
    assert(!meStr.includes('secret'), 'User profile response omits secret key');

    // Check admin dashboard payload
    const dashStr = JSON.stringify(adminDashboardRes.data);
    assert(!dashStr.includes('passwordHash'), 'Admin dashboard response omits passwordHash');
    assert(!dashStr.includes('password"'), 'Admin dashboard response omits password');

    // ============================================================
    // Test 16: Production Error Response Hygiene
    // ============================================================
    console.log('\n17. Error Response Hygiene:');
    const notFoundRes = await makeRequest('/api/non-existent-endpoint-path-xyz');
    assert(notFoundRes.status === 404, 'Non-existent route returns 404');
    assert(notFoundRes.data?.success === false, '404 returns success: false');
    assert(!JSON.stringify(notFoundRes.data).includes('C:\\Users'), 'Error response does not leak internal Windows file paths');

    // ============================================================
    // Test 17: Rate Limiting Enforcement
    // ============================================================
    console.log('\n18. Rate Limiting Middleware Verification:');
    // 17A: RateLimit headers present on normal request
    assert(Boolean(healthRes.headers['ratelimit-limit']), 'RateLimit-Limit header is present');
    assert(Boolean(healthRes.headers['ratelimit-remaining']), 'RateLimit-Remaining header is present');

    // 17B: Test threshold enforcement using dedicated test limiter
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 3,
      message: 'Test rate limit reached'
    });

    const testApp = require('express')();
    testApp.use(testLimiter);
    testApp.get('/test-limit', (req, res) => res.json({ success: true }));

    const testServer = http.createServer(testApp);
    await new Promise((resolve) => testServer.listen(0, resolve));
    const testPort = testServer.address().port;

    const hitLimiter = () => {
      return new Promise((resolve) => {
        http.get(`http://127.0.0.1:${testPort}/test-limit`, {
          headers: { 'x-force-rate-limit': 'true' }
        }, (res) => {
          resolve(res.statusCode);
        });
      });
    };

    const status1 = await hitLimiter();
    const status2 = await hitLimiter();
    const status3 = await hitLimiter();
    const status4 = await hitLimiter(); // Should exceed max: 3

    testServer.close();

    assert(status1 === 200 && status2 === 200 && status3 === 200, 'Requests 1-3 within limit return 200 OK');
    assert(status4 === 429, `Request 4 exceeding limit returns HTTP 429 Too Many Requests (got ${status4})`);

    // ============================================================
    // Test 18: Environment & Secrets Hygiene
    // ============================================================
    console.log('\n19. Environment & Secrets Configuration Hygiene:');
    assert(Boolean(process.env.JWT_SECRET), 'JWT_SECRET is configured in environment');
    assert(process.env.JWT_SECRET.length >= 16, 'JWT_SECRET has sufficient entropy (>= 16 chars)');
    assert(Boolean(process.env.MONGODB_URI), 'MONGODB_URI is configured in environment');
    assert(!process.env.JWT_SECRET.includes('hardcoded_in_code'), 'JWT secret is not hardcoded fallback string');

    // ============================================================
    // Test 19: Existing Admin APIs Regression
    // ============================================================
    console.log('\n20. Existing Admin APIs Regression:');
    const adminStatusRes = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminStatusRes.status === 200, 'GET /api/admin/status returns 200 OK');
    assert(adminStatusRes.data?.data?.verified === true, 'Admin status verified flag is true');

    const adminBrandsRes = await makeRequest('/api/admin/brands', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminBrandsRes.status === 200, 'GET /api/admin/brands returns 200 OK under hardened middleware');

    // ============================================================
    // Test 20: Existing Customer APIs Regression
    // ============================================================
    console.log('\n21. Existing Customer APIs Regression:');
    const customerLeadsRes = await makeRequest('/api/leads/my', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerLeadsRes.status === 200, 'GET /api/leads/my returns 200 OK under hardened middleware');

    const publicBikesRes = await makeRequest('/api/bikes');
    assert(publicBikesRes.status === 200, 'Public GET /api/bikes returns 200 OK under hardened middleware');

    const publicShowroomsRes = await makeRequest('/api/showrooms');
    assert(publicShowroomsRes.status === 200, 'Public GET /api/showrooms returns 200 OK under hardened middleware');

  } catch (error) {
    console.error('Security test encountered unexpected failure:', error);
    assert(false, `Unexpected error during security test execution: ${error.message}`);
  } finally {
    console.log('\n22. Security Test Teardown:');
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`  Cleaned up ${createdUserIds.length} temporary test user accounts`);
    }
    server.close();
    await disconnectDatabase();
    console.log('  Ephemeral test server closed and database connection terminated.');
  }

  console.log('\n================================================================');
  console.log(` PHASE 5 STEP 1 RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep5aSecurityTests();
