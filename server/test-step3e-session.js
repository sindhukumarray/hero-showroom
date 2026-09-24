const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables for database connection
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runSessionTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 5 SESSION & LOGOUT AUDIT         ');
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
  console.log('1. Connecting to Database for Session Audit:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for session testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    console.error('Database connection is required for live session testing.');
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

  const testEmailPrefix = `test-step3e-${Date.now()}`;
  const customerEmail = `${testEmailPrefix}-customer@heroshowroom.example.com`;
  const adminEmail = `${testEmailPrefix}-admin@heroshowroom.example.com`;
  const inactiveEmail = `${testEmailPrefix}-inactive@heroshowroom.example.com`;
  const testPassword = 'SessionSecurePass2026!';

  let customerUser, adminUser, inactiveUser;
  let customerToken, adminToken, inactiveToken;

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test accounts
    customerUser = await User.create({
      name: 'Session Customer Rider',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 44444',
      isActive: true
    });

    adminUser = await User.create({
      name: 'Session Platform Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      phone: '+91 98765 55555',
      isActive: true
    });

    inactiveUser = await User.create({
      name: 'Session Inactive Rider',
      email: inactiveEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 66666',
      isActive: false
    });

    const secret = authConfig.getJwtSecret();
    customerToken = jwt.sign({ sub: customerUser._id.toString(), role: customerUser.role }, secret, { expiresIn: '1h' });
    adminToken = jwt.sign({ sub: adminUser._id.toString(), role: adminUser.role }, secret, { expiresIn: '1h' });
    inactiveToken = jwt.sign({ sub: inactiveUser._id.toString(), role: inactiveUser.role }, secret, { expiresIn: '1h' });

    assert(Boolean(customerUser), 'Active customer user created in DB');
    assert(Boolean(adminUser), 'Active admin user created in DB');
    assert(Boolean(inactiveUser), 'Inactive user created in DB');

    // ==============================================================
    // 3. GET /api/auth/me Session Tests
    // ==============================================================
    console.log('\n3. GET /api/auth/me Session Audits:');

    // 3.1 Valid customer token
    const resCustMe = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken}` });
    assert(resCustMe.status === 200, 'Valid customer token returns 200 OK');
    assert(resCustMe.data.success === true, 'Customer /me returns success: true');
    assert(resCustMe.data.data.user.email === customerEmail.toLowerCase(), 'Customer /me returns matching email');
    assert(resCustMe.data.data.user.role === ROLES.CUSTOMER, 'Customer /me returns role "customer"');

    // 3.2 Valid admin token
    const resAdminMe = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${adminToken}` });
    assert(resAdminMe.status === 200, 'Valid admin token returns 200 OK');
    assert(resAdminMe.data.success === true, 'Admin /me returns success: true');
    assert(resAdminMe.data.data.user.email === adminEmail.toLowerCase(), 'Admin /me returns matching email');
    assert(resAdminMe.data.data.user.role === ROLES.ADMIN, 'Admin /me returns role "admin"');

    // 3.3 Missing Authorization header
    const resNoAuth = await makeRequest('/api/auth/me', 'GET');
    assert(resNoAuth.status === 401, 'Missing Authorization header returns 401');
    assert(resNoAuth.data.message === 'Authentication required', 'Missing Authorization header returns "Authentication required"');

    // 3.4 Malformed Authorization headers
    const resBasicAuth = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Basic ${customerToken}` });
    assert(resBasicAuth.status === 401, 'Basic authorization scheme returns 401');

    const resEmptyBearer = await makeRequest('/api/auth/me', 'GET', null, { Authorization: 'Bearer ' });
    assert(resEmptyBearer.status === 401, 'Empty Bearer token returns 401');

    const resMultiBearer = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken} extra` });
    assert(resMultiBearer.status === 401, 'Bearer token with multiple words returns 401');

    // 3.5 Invalid JWT
    const resInvalidJwt = await makeRequest('/api/auth/me', 'GET', null, { Authorization: 'Bearer invalid.jwt.structure' });
    assert(resInvalidJwt.status === 401, 'Invalid JWT structure returns 401');

    const resTamperedJwt = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken.slice(0, -6)}tamper` });
    assert(resTamperedJwt.status === 401, 'Tampered JWT signature returns 401');

    // 3.6 Expired JWT
    const expiredToken = jwt.sign({ sub: customerUser._id.toString(), role: customerUser.role }, secret, { expiresIn: '-1s' });
    const resExpired = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${expiredToken}` });
    assert(resExpired.status === 401, 'Expired JWT returns 401');
    assert(resExpired.data.message === 'Invalid or expired token', 'Expired JWT returns "Invalid or expired token"');

    // 3.7 Valid token for deleted / non-existent user
    const nonexistentUserId = '507f1f77bcf86cd799439011';
    const nonexistentToken = jwt.sign({ sub: nonexistentUserId, role: ROLES.CUSTOMER }, secret, { expiresIn: '1h' });
    const resNonexistent = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${nonexistentToken}` });
    assert(resNonexistent.status === 401, 'Valid token for non-existent user returns 401');

    // 3.8 Valid token for inactive user
    const resInactive = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${inactiveToken}` });
    assert(resInactive.status === 401, 'Valid token for inactive user returns 401');
    assert(resInactive.data.message === 'Invalid or expired token', 'Inactive user returns generic auth message');

    // 3.9 Credential exclusion in /me response
    const mePayload = resCustMe.data;
    assert(mePayload.data.user.password === undefined, 'password is NOT returned in data.user');
    assert(mePayload.data.user.passwordHash === undefined, 'passwordHash is NOT returned in data.user');
    assert(mePayload.password === undefined, 'password is NOT returned at root');
    assert(mePayload.passwordHash === undefined, 'passwordHash is NOT returned at root');
    assert(mePayload.accessToken === undefined, 'accessToken is NOT returned in /me response');
    assert(mePayload.data.accessToken === undefined, 'accessToken is NOT returned in data object');
    assert(mePayload.data.user.__v === undefined, '__v is NOT exposed in data.user');

    // ==============================================================
    // 4. POST /api/auth/logout Tests
    // ==============================================================
    console.log('\n4. POST /api/auth/logout Session Audits:');

    // Snapshot user document in DB before logout
    const preLogoutUser = await User.findById(customerUser._id).lean();

    // 4.1 Valid customer token logout
    const resCustLogout = await makeRequest('/api/auth/logout', 'POST', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(resCustLogout.status === 200, 'Valid customer token logout returns 200 OK');
    assert(resCustLogout.data.success === true, 'Logout response success is true');
    assert(resCustLogout.data.message === 'Logged out successfully', 'Logout response message is "Logged out successfully"');

    // 4.2 Valid admin token logout
    const resAdminLogout = await makeRequest('/api/auth/logout', 'POST', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminLogout.status === 200, 'Valid admin token logout returns 200 OK');
    assert(resAdminLogout.data.success === true, 'Admin logout response success is true');
    assert(resAdminLogout.data.message === 'Logged out successfully', 'Admin logout response message is "Logged out successfully"');

    // 4.3 Missing token on logout
    const resNoAuthLogout = await makeRequest('/api/auth/logout', 'POST');
    assert(resNoAuthLogout.status === 401, 'Missing token on logout returns 401');
    assert(resNoAuthLogout.data.message === 'Authentication required', 'Missing token returns "Authentication required"');

    // 4.4 Empty token on logout
    const resEmptyLogout = await makeRequest('/api/auth/logout', 'POST', null, { Authorization: 'Bearer ' });
    assert(resEmptyLogout.status === 401, 'Empty Bearer token on logout returns 401');

    // 4.5 Invalid token on logout
    const resInvalidLogout = await makeRequest('/api/auth/logout', 'POST', null, { Authorization: 'Bearer invalid_token' });
    assert(resInvalidLogout.status === 401, 'Invalid token on logout returns 401');

    // 4.6 Expired token on logout
    const resExpiredLogout = await makeRequest('/api/auth/logout', 'POST', null, { Authorization: `Bearer ${expiredToken}` });
    assert(resExpiredLogout.status === 401, 'Expired token on logout returns 401');

    // 4.7 Security: response does NOT expose token or secrets
    const logoutString = JSON.stringify(resCustLogout.data);
    assert(!logoutString.includes(customerToken), 'Logout response does NOT expose customer access token');
    assert(!logoutString.includes(secret), 'Logout response does NOT expose JWT secret');
    assert(resCustLogout.data.token === undefined, 'No "token" property in logout response');
    assert(resCustLogout.data.accessToken === undefined, 'No "accessToken" property in logout response');

    // 4.8 Logout integrity: verify user document in DB was NOT mutated
    const postLogoutUser = await User.findById(customerUser._id).lean();
    assert(Boolean(postLogoutUser), 'User still exists in DB after logout');
    assert(postLogoutUser.name === preLogoutUser.name, 'User name was not changed by logout');
    assert(postLogoutUser.email === preLogoutUser.email, 'User email was not changed by logout');
    assert(postLogoutUser.role === preLogoutUser.role, 'User role was not changed by logout');
    assert(postLogoutUser.phone === preLogoutUser.phone, 'User phone was not changed by logout');
    assert(postLogoutUser.isActive === preLogoutUser.isActive, 'User isActive was not changed by logout');
    assert(postLogoutUser.passwordHash === preLogoutUser.passwordHash, 'User passwordHash was not changed by logout');
    assert(
      postLogoutUser.updatedAt.getTime() === preLogoutUser.updatedAt.getTime(),
      'User updatedAt was not mutated by logout'
    );

    // ==============================================================
    // 5. Auth Flow Regression (Register -> Login -> Me -> Logout)
    // ==============================================================
    console.log('\n5. End-to-End Session Lifecycle Regression:');

    const lifecycleEmail = `${testEmailPrefix}-lifecycle@heroshowroom.example.com`;
    const lifecyclePassword = 'LifecyclePass2026!';

    // Register
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Lifecycle Rider',
      email: lifecycleEmail,
      password: lifecyclePassword,
      phone: '+91 91111 22222'
    });
    assert(regRes.status === 201, 'Lifecycle: registration returns 201 Created');

    // Login
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: lifecycleEmail,
      password: lifecyclePassword
    });
    assert(loginRes.status === 200, 'Lifecycle: login returns 200 OK');
    const lifecycleToken = loginRes.data.data.accessToken;
    assert(Boolean(lifecycleToken), 'Lifecycle: login returned access token');

    // GET /me
    const meRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${lifecycleToken}`
    });
    assert(meRes.status === 200, 'Lifecycle: GET /me returns 200 OK');
    assert(meRes.data.data.user.email === lifecycleEmail.toLowerCase(), 'Lifecycle: user profile matches');

    // POST /logout
    const logoutRes = await makeRequest('/api/auth/logout', 'POST', null, {
      Authorization: `Bearer ${lifecycleToken}`
    });
    assert(logoutRes.status === 200, 'Lifecycle: POST /logout returns 200 OK');
    assert(logoutRes.data.message === 'Logged out successfully', 'Lifecycle: logout acknowledged');

    // Clean up lifecycle user
    await User.deleteOne({ email: lifecycleEmail.toLowerCase() });

  } finally {
    // Clean up temporary test users
    console.log('\n6. Cleaning up Temporary Test Accounts:');
    try {
      if (customerUser) await User.deleteOne({ _id: customerUser._id });
      if (adminUser) await User.deleteOne({ _id: adminUser._id });
      if (inactiveUser) await User.deleteOne({ _id: inactiveUser._id });
      console.log('  Temporary test accounts removed cleanly.');
    } catch (e) {
      console.warn('  Cleanup warning:', e.message);
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

runSessionTests().catch((err) => {
  console.error('Fatal error during session testing:', err);
  process.exit(1);
});
