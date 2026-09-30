const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runAdminFoundationTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 4 STEP 1 ADMIN FOUNDATION & RBAC AUDIT   ');
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
    assert(isConnected(), 'Database connected successfully for Admin foundation testing');
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

  const testEmailPrefix = `test-admin-fnd-${Date.now()}`;
  const customerEmail = `${testEmailPrefix}-customer@heroshowroom.example.com`;
  const adminEmail = `${testEmailPrefix}-admin@heroshowroom.example.com`;
  const testPassword = 'AdminSecurePass2026!';

  let customerUser, adminUser;
  let customerToken, adminToken;

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test accounts
    customerUser = await User.create({
      name: 'Standard Customer',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 33333',
      isActive: true
    });

    adminUser = await User.create({
      name: 'Super Administrator',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      phone: '+91 98765 44444',
      isActive: true
    });

    const secret = authConfig.getJwtSecret();
    customerToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { sub: adminUser._id.toString(), role: adminUser.role },
      secret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // ============================================================
    // 3. Admin Security & Guard Verification
    // ============================================================
    console.log('\n3. Verifying /api/admin Authorization Guards:');

    // 3.1 Unauthenticated access
    const unauthRes = await makeRequest('/api/admin/status');
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/admin/status rejected with 401');
    assert(unauthRes.data?.success === false, 'Unauthenticated response indicates success=false');

    // 3.2 Malformed Bearer token
    const malformedRes = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: 'Bearer invalid.token.payload'
    });
    assert(malformedRes.status === 401, 'Malformed token rejected with 401');

    // 3.3 CUSTOMER role forbidden from Admin API
    const customerRes = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(customerRes.status === 403, 'Customer role accessing /api/admin/status rejected with 403 Forbidden');
    assert(customerRes.data?.success === false, 'Forbidden customer response indicates success=false');
    assert(customerRes.data?.message === 'Forbidden', 'Forbidden message received for customer role');

    // 3.4 ADMIN role authorized on Admin API
    const adminRes = await makeRequest('/api/admin/status', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminRes.status === 200, 'Admin role accessing /api/admin/status accepted with 200 OK');
    assert(adminRes.data?.success === true, 'Admin response indicates success=true');
    assert(adminRes.data?.data?.verified === true, 'Admin status reports verified=true');
    assert(adminRes.data?.data?.admin?.role === 'admin', 'Admin response confirms role=admin');
    assert(adminRes.data?.data?.admin?.name === 'Super Administrator', 'Admin response confirms admin name');
    assert(adminRes.data?.data?.serverTime !== undefined, 'Admin status includes live server timestamp');

    // ============================================================
    // 4. Customer Workflows Unaffected
    // ============================================================
    console.log('\n4. Verifying Existing Customer & Public Endpoints Remain Functional:');

    // Customer can access customer /auth/me
    const meRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(meRes.status === 200, 'Customer successfully accesses /api/auth/me');
    assert(meRes.data?.data?.user?.email === customerEmail, 'Customer identity matches profile');

    // Customer can access customer /leads/my
    const leadsRes = await makeRequest('/api/leads/my', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(leadsRes.status === 200, 'Customer successfully accesses /api/leads/my');

    // Public health check works
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.status === 200, 'Public /api/health endpoint returns 200 OK');

    // Public catalogue works
    const brandsRes = await makeRequest('/api/brands');
    assert(brandsRes.status === 200, 'Public /api/brands returns 200 OK');

    const bikesRes = await makeRequest('/api/bikes');
    assert(bikesRes.status === 200, 'Public /api/bikes returns 200 OK');

    const showroomsRes = await makeRequest('/api/showrooms');
    assert(showroomsRes.status === 200, 'Public /api/showrooms returns 200 OK');

  } finally {
    // Cleanup
    console.log('\n5. Cleaning up Test Fixtures:');
    if (customerUser) await User.findByIdAndDelete(customerUser._id);
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    console.log('  Cleaned up test accounts.');

    server.close();
    await disconnectDatabase();
    console.log('  Disconnected from test database.');
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed}/${checks} CHECKS PASSED (${failed} FAILED)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdminFoundationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
