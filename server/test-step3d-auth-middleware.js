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
const { ROLES, ALLOWED_ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');
const { verifyToken, requireRole } = require('./src/middleware/authMiddleware');

async function runAuthMiddlewareTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 4 JWT & RBAC MIDDLEWARE AUDIT    ');
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
  console.log('1. Connecting to Database for Auth Middleware Testing:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for auth middleware testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    console.error('Database connection is required for live protected route testing.');
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

  const testEmailPrefix = `test-step3d-${Date.now()}`;
  const customerEmail = `${testEmailPrefix}-customer@heroshowroom.example.com`;
  const adminEmail = `${testEmailPrefix}-admin@heroshowroom.example.com`;
  const inactiveEmail = `${testEmailPrefix}-inactive@heroshowroom.example.com`;
  const testPassword = 'SecureAuthPass2026!';

  let customerUser, adminUser, inactiveUser;
  let customerToken, adminToken, inactiveToken;

  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test accounts
    customerUser = await User.create({
      name: 'Test Customer Rider',
      email: customerEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 11111',
      isActive: true
    });

    adminUser = await User.create({
      name: 'Test Platform Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      phone: '+91 98765 22222',
      isActive: true
    });

    inactiveUser = await User.create({
      name: 'Test Inactive Rider',
      email: inactiveEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 33333',
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
    // 3. Authorization Header & Bearer Format Validation
    // ==============================================================
    console.log('\n3. Authorization Header & Bearer Format Tests:');

    // 3.1 Missing Authorization header
    const resNoHeader = await makeRequest('/api/auth/me', 'GET');
    assert(resNoHeader.status === 401, 'Missing Authorization header returns 401');
    assert(resNoHeader.data.message === 'Authentication required', 'Missing Authorization header returns "Authentication required"');

    // 3.2 Empty Authorization header
    const resEmptyHeader = await makeRequest('/api/auth/me', 'GET', null, { Authorization: '' });
    assert(resEmptyHeader.status === 401, 'Empty Authorization header returns 401');

    // 3.3 Missing Bearer prefix (Basic)
    const resBasicScheme = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Basic ${customerToken}` });
    assert(resBasicScheme.status === 401, 'Non-Bearer Authorization scheme returns 401');

    // 3.4 Missing Bearer prefix (Raw token)
    const resRawToken = await makeRequest('/api/auth/me', 'GET', null, { Authorization: customerToken });
    assert(resRawToken.status === 401, 'Token without "Bearer " prefix returns 401');

    // 3.5 Empty Bearer token
    const resEmptyBearer = await makeRequest('/api/auth/me', 'GET', null, { Authorization: 'Bearer ' });
    assert(resEmptyBearer.status === 401, 'Empty Bearer token returns 401');

    // 3.6 Malformed Bearer header (multiple spaces or extra words)
    const resMultiWord = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken} extra` });
    assert(resMultiWord.status === 401, 'Bearer header with extraneous parts returns 401');

    // 3.7 Malformed JWT string
    const resMalformedJwt = await makeRequest('/api/auth/me', 'GET', null, { Authorization: 'Bearer this.is.not.a.valid.jwt' });
    assert(resMalformedJwt.status === 401, 'Malformed JWT string returns 401');
    assert(resMalformedJwt.data.message === 'Invalid or expired token', 'Malformed JWT returns generic "Invalid or expired token"');

    // ==============================================================
    // 4. JWT Cryptographic Verification & Expiration
    // ==============================================================
    console.log('\n4. JWT Cryptographic Signature & Expiration Tests:');

    // 4.1 Valid JWT succeeds
    const resValidJwt = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken}` });
    assert(resValidJwt.status === 200, 'Valid JWT access token returns 200 OK');

    // 4.2 Expired JWT returns 401
    const expiredToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      secret,
      { expiresIn: '-1s' }
    );
    const resExpired = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${expiredToken}` });
    assert(resExpired.status === 401, 'Expired JWT returns 401');
    assert(resExpired.data.message === 'Invalid or expired token', 'Expired JWT returns "Invalid or expired token"');

    // 4.3 Wrong JWT secret / forged signature returns 401
    const wrongSecretToken = jwt.sign(
      { sub: customerUser._id.toString(), role: customerUser.role },
      'wrong_unauthorized_secret_key_123456789',
      { expiresIn: '1h' }
    );
    const resWrongSecret = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${wrongSecretToken}` });
    assert(resWrongSecret.status === 401, 'Token signed with wrong secret returns 401');

    // 4.4 Tampered payload signature
    const parts = customerToken.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: customerUser._id.toString(), role: 'admin' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const resTampered = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${tamperedToken}` });
    assert(resTampered.status === 401, 'Tampered token payload returns 401');

    // ==============================================================
    // 5. JWT Claim Validation & Identity Attachment
    // ==============================================================
    console.log('\n5. JWT Claim Validation & Identity Attachment:');

    // 5.1 Missing `sub` claim
    const noSubToken = jwt.sign({ role: 'customer' }, secret, { expiresIn: '1h' });
    const resNoSub = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${noSubToken}` });
    assert(resNoSub.status === 401, 'Token without "sub" claim returns 401');

    // 5.2 Empty `sub` claim
    const emptySubToken = jwt.sign({ sub: '   ', role: 'customer' }, secret, { expiresIn: '1h' });
    const resEmptySub = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${emptySubToken}` });
    assert(resEmptySub.status === 401, 'Token with blank "sub" claim returns 401');

    // 5.3 Missing `role` claim
    const noRoleToken = jwt.sign({ sub: customerUser._id.toString() }, secret, { expiresIn: '1h' });
    const resNoRole = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${noRoleToken}` });
    assert(resNoRole.status === 401, 'Token without "role" claim returns 401');

    // 5.4 Invalid / forged arbitrary role claim
    const forgedRoleToken = jwt.sign({ sub: customerUser._id.toString(), role: 'superadmin' }, secret, { expiresIn: '1h' });
    const resForgedRole = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${forgedRoleToken}` });
    assert(resForgedRole.status === 401, 'Token with unapproved role "superadmin" returns 401');

    const rootRoleToken = jwt.sign({ sub: customerUser._id.toString(), role: 'root' }, secret, { expiresIn: '1h' });
    const resRootRole = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${rootRoleToken}` });
    assert(resRootRole.status === 401, 'Token with unapproved role "root" returns 401');

    // 5.5 Unit audit on verifyToken populating req.user
    let mockReq = {
      headers: { authorization: `Bearer ${customerToken}` }
    };
    let mockRes = {};
    let nextCalled = false;
    verifyToken(mockReq, mockRes, () => { nextCalled = true; });
    assert(nextCalled, 'verifyToken middleware calls next() on valid token');
    assert(Boolean(mockReq.user), 'verifyToken attaches req.user');
    assert(mockReq.user.id === customerUser._id.toString(), 'req.user.id matches token sub');
    assert(mockReq.user.role === ROLES.CUSTOMER, 'req.user.role matches token role');
    assert(Object.isFrozen(mockReq.user), 'req.user is frozen against downstream mutation');

    // 5.6 Request body cannot override authenticated identity
    mockReq = {
      headers: { authorization: `Bearer ${customerToken}` },
      body: { user: { id: 'spoofed_id', role: 'admin' }, role: 'admin' }
    };
    verifyToken(mockReq, mockRes, () => {});
    assert(mockReq.user.id === customerUser._id.toString(), 'Request body cannot spoof req.user.id');
    assert(mockReq.user.role === ROLES.CUSTOMER, 'Request body cannot spoof req.user.role');

    // ==============================================================
    // 6. Role-Based Access Control (RBAC) Tests
    // ==============================================================
    console.log('\n6. Role-Based Access Control (RBAC) Tests:');

    // 6.1 Customer accessing admin-only route (/api/auth/admin-test) -> 403 Forbidden
    const resCustomerOnAdmin = await makeRequest('/api/auth/admin-test', 'GET', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(resCustomerOnAdmin.status === 403, 'Customer accessing admin-only route returns 403 Forbidden');
    assert(resCustomerOnAdmin.data.message === 'Forbidden', 'Forbidden message is returned to customer');

    // 6.2 Admin accessing admin-only route (/api/auth/admin-test) -> 200 OK
    const resAdminOnAdmin = await makeRequest('/api/auth/admin-test', 'GET', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminOnAdmin.status === 200, 'Admin accessing admin-only route returns 200 OK');
    assert(resAdminOnAdmin.data.success === true, 'Admin response success flag is true');
    assert(resAdminOnAdmin.data.data.user.role === ROLES.ADMIN, 'Admin identity confirmed in response');

    // 6.3 Unauthenticated accessing admin-only route -> 401 Unauthorized
    const resNoAuthAdmin = await makeRequest('/api/auth/admin-test', 'GET');
    assert(resNoAuthAdmin.status === 401, 'Unauthenticated request to admin route returns 401 (not 403)');

    // 6.4 Unit tests on requireRole middleware factory
    const adminOnlyMiddleware = requireRole(ROLES.ADMIN);
    let rbacNextCalled = false;
    let rbacRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };

    // Unauthenticated call
    adminOnlyMiddleware({}, rbacRes, () => { rbacNextCalled = true; });
    assert(rbacRes.statusCode === 401, 'requireRole without req.user returns 401');

    // Insufficient permissions
    rbacRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };
    adminOnlyMiddleware({ user: { id: '123', role: ROLES.CUSTOMER } }, rbacRes, () => { rbacNextCalled = true; });
    assert(rbacRes.statusCode === 403, 'requireRole with non-matching role returns 403');
    assert(rbacRes.body.message === 'Forbidden', 'requireRole returns message "Forbidden"');

    // Sufficient permissions
    rbacNextCalled = false;
    adminOnlyMiddleware({ user: { id: '123', role: ROLES.ADMIN } }, rbacRes, () => { rbacNextCalled = true; });
    assert(rbacNextCalled, 'requireRole with matching role calls next()');

    // Multi-role acceptance
    const multiRoleMiddleware = requireRole(ROLES.CUSTOMER, ROLES.ADMIN);
    let custAllowed = false;
    let adminAllowed = false;
    multiRoleMiddleware({ user: { id: '1', role: ROLES.CUSTOMER } }, rbacRes, () => { custAllowed = true; });
    multiRoleMiddleware({ user: { id: '2', role: ROLES.ADMIN } }, rbacRes, () => { adminAllowed = true; });
    assert(custAllowed && adminAllowed, 'requireRole correctly allows multiple configured roles');

    // ==============================================================
    // 7. Protected Route (/api/auth/me) Audits
    // ==============================================================
    console.log('\n7. Protected Route (/api/auth/me) Audits:');

    // 7.1 Valid token retrieves current user profile
    const resMe = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${customerToken}` });
    assert(resMe.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(resMe.data.success === true, 'Response success is true');
    assert(Boolean(resMe.data.data && resMe.data.data.user), 'Response contains data.user');

    const meUser = resMe.data.data.user;
    assert(meUser.id === customerUser._id.toString(), 'meUser.id matches expected user id');
    assert(meUser.email === customerEmail.toLowerCase(), 'meUser.email matches expected email');
    assert(meUser.role === ROLES.CUSTOMER, 'meUser.role is customer');
    assert(meUser.isActive === true, 'meUser.isActive is true');
    assert(typeof meUser.name === 'string' && meUser.name.length > 0, 'meUser.name is returned');
    assert(typeof meUser.createdAt === 'string', 'meUser.createdAt timestamp is returned');

    // 7.2 Strict credential leakage verification
    assert(meUser.password === undefined, 'password is NOT present in /api/auth/me response');
    assert(meUser.passwordHash === undefined, 'passwordHash is NOT present in /api/auth/me response');
    assert(resMe.data.password === undefined, 'Top-level password is NOT present');
    assert(resMe.data.passwordHash === undefined, 'Top-level passwordHash is NOT present');
    assert(meUser.__v === undefined, '__v is NOT exposed in response');

    // 7.3 Inactive account rejection
    const resInactiveMe = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${inactiveToken}` });
    assert(resInactiveMe.status === 401, 'Inactive account token calling /api/auth/me returns 401');
    assert(resInactiveMe.data.message === 'Invalid or expired token', 'Inactive account returns generic auth message');

    // 7.4 Deleted / non-existent user account rejection
    const nonExistentUserId = '507f1f77bcf86cd799439011';
    const nonExistentToken = jwt.sign({ sub: nonExistentUserId, role: ROLES.CUSTOMER }, secret, { expiresIn: '1h' });
    const resDeletedMe = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${nonExistentToken}` });
    assert(resDeletedMe.status === 401, 'Token for non-existent user returns 401');

    // ==============================================================
    // 8. Security & Secret Hygiene Audits
    // ==============================================================
    console.log('\n8. Security & Secret Hygiene Audits:');

    // 8.1 JWT secret is never returned in any response
    const meString = JSON.stringify(resMe.data);
    assert(!meString.includes(secret), 'JWT secret is not leaked in /api/auth/me response');

    const errString = JSON.stringify(resExpired.data);
    assert(!errString.includes(secret), 'JWT secret is not leaked in error response');

    // 8.2 Internal jsonwebtoken errors are not exposed to client
    assert(!errString.includes('jwt expired'), 'Internal jsonwebtoken "jwt expired" is sanitized');
    assert(!JSON.stringify(resMalformedJwt.data).includes('jwt malformed'), 'Internal jsonwebtoken "jwt malformed" is sanitized');
    assert(!JSON.stringify(resWrongSecret.data).includes('invalid signature'), 'Internal jsonwebtoken "invalid signature" is sanitized');

    // ==============================================================
    // 9. Regression Testing (Registration & Login Intact)
    // ==============================================================
    console.log('\n9. Auth Regression Checks (Registration & Login):');

    // 9.1 Register a new customer
    const regEmail = `${testEmailPrefix}-newreg@heroshowroom.example.com`;
    const resReg = await makeRequest('/api/auth/register', 'POST', {
      name: 'Regression Rider',
      email: regEmail,
      password: 'RegressionPass2026!',
      phone: '+91 99999 88888'
    });
    assert(resReg.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(resReg.data.success === true, 'Registration succeeded');

    // 9.2 Login with newly registered customer
    const resLogin = await makeRequest('/api/auth/login', 'POST', {
      email: regEmail,
      password: 'RegressionPass2026!'
    });
    assert(resLogin.status === 200, 'POST /api/auth/login returns 200 OK');
    assert(Boolean(resLogin.data.data.accessToken), 'Login returns accessToken');

    // 9.3 Access /me using token received from login
    const loginToken = resLogin.data.data.accessToken;
    const resMeFromLogin = await makeRequest('/api/auth/me', 'GET', null, { Authorization: `Bearer ${loginToken}` });
    assert(resMeFromLogin.status === 200, 'Token from login allows access to /api/auth/me');
    assert(resMeFromLogin.data.data.user.email === regEmail.toLowerCase(), 'User profile matches logged in user');

    // Clean up temporary regression account
    await User.deleteOne({ email: regEmail.toLowerCase() });

  } finally {
    // Clean up temporary test users
    console.log('\n10. Cleaning up Temporary Test Accounts:');
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

runAuthMiddlewareTests().catch((err) => {
  console.error('Fatal error during auth middleware testing:', err);
  process.exit(1);
});
