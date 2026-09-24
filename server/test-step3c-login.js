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

async function runLoginTests() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 3 LOGIN & JWT AUDIT   ');
  console.log('=====================================================\n');

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
  console.log('1. Connecting to Database for Login Verification:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for login testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    console.error('Database connection is required for live login testing.');
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Live test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'POST', body = null) => {
    return new Promise((resolve, reject) => {
      const postData = body !== null ? JSON.stringify(body) : '';
      const headers = {
        'Content-Type': 'application/json'
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

  const testEmailPrefix = `test-step3c-${Date.now()}`;
  const validEmail = `${testEmailPrefix}-user@heroshowroom.example.com`;
  const validPassword = 'CorrectRiderPass2026!';
  const inactiveEmail = `${testEmailPrefix}-inactive@heroshowroom.example.com`;

  try {
    // Seed test users directly
    const hashedPassword = await bcrypt.hash(validPassword, 10);
    const activeTestUser = await User.create({
      name: 'Active Test Rider',
      email: validEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 12345',
      isActive: true
    });

    const inactiveTestUser = await User.create({
      name: 'Inactive Test Rider',
      email: inactiveEmail.toLowerCase(),
      passwordHash: hashedPassword,
      role: ROLES.CUSTOMER,
      phone: '+91 98765 67890',
      isActive: false
    });

    assert(Boolean(activeTestUser), 'Active test user created in database');
    assert(Boolean(inactiveTestUser), 'Inactive test user created in database');

    // 3. Login Input Validation Audits
    console.log('\n3. Auditing Login Request Validation:');

    // Missing email
    const noEmailRes = await makeRequest('/api/auth/login', 'POST', {
      password: validPassword
    });
    assert(noEmailRes.status === 400, 'Missing email fails with HTTP 400');
    assert(
      noEmailRes.data.errors && noEmailRes.data.errors.some((e) => e.includes('email')),
      'Validation error indicates missing email'
    );

    // Invalid email format
    const badEmailRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'not-an-email-format',
      password: validPassword
    });
    assert(badEmailRes.status === 400, 'Invalid email format fails with HTTP 400');

    // Empty email string
    const emptyEmailRes = await makeRequest('/api/auth/login', 'POST', {
      email: '   ',
      password: validPassword
    });
    assert(emptyEmailRes.status === 400, 'Empty email string fails with HTTP 400');

    // Missing password
    const noPassRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail
    });
    assert(noPassRes.status === 400, 'Missing password fails with HTTP 400');
    assert(
      noPassRes.data.errors && noPassRes.data.errors.some((e) => e.includes('password')),
      'Validation error indicates missing password'
    );

    // Empty password string
    const emptyPassRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: ''
    });
    assert(emptyPassRes.status === 400, 'Empty password fails with HTTP 400');

    // Array request payload
    const arrayBodyRes = await makeRequest('/api/auth/login', 'POST', [{ email: validEmail }]);
    assert(arrayBodyRes.status === 400, 'Array request payload is rejected with HTTP 400');

    // MongoDB operator injection attempt
    const operatorInjectionRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: validPassword,
      $gt: 'inject'
    });
    assert(operatorInjectionRes.status === 400, 'Payload containing MongoDB operator ($gt) is rejected with HTTP 400');

    // Disallowed sensitive fields in login request
    const roleInjectionRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: validPassword,
      role: 'admin'
    });
    assert(roleInjectionRes.status === 400, 'Payload with sensitive field "role" is rejected with HTTP 400');

    const hashInjectionRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: validPassword,
      passwordHash: 'injected_hash'
    });
    assert(hashInjectionRes.status === 400, 'Payload with sensitive field "passwordHash" is rejected with HTTP 400');

    const userIdInjectionRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: validPassword,
      userId: '6ab4cb0c8e9b26c64275b946'
    });
    assert(userIdInjectionRes.status === 400, 'Payload with sensitive field "userId" is rejected with HTTP 400');

    // 4. Successful Authentication & JWT Issuance
    console.log('\n4. Auditing Successful Login & JWT Issuance:');
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: `  ${validEmail.toUpperCase()}  `,
      password: validPassword
    });

    assert(loginRes.status === 200, 'Valid login succeeds with HTTP 200 OK');
    assert(loginRes.data.success === true, 'Response contains success: true');
    assert(loginRes.data.message === 'Login successful', 'Response message is "Login successful"');

    const token = loginRes.data.accessToken || loginRes.data.data?.accessToken;
    assert(Boolean(token), 'Response contains accessToken');
    assert(typeof token === 'string' && token.split('.').length === 3, 'accessToken is a properly formatted JWT');

    const returnedUser = loginRes.data.user || loginRes.data.data?.user;
    assert(Boolean(returnedUser), 'Response contains returned user object');
    assert(returnedUser.id === activeTestUser._id.toString(), 'Returned user id matches database ID');
    assert(returnedUser.name === 'Active Test Rider', 'Returned user name matches');
    assert(returnedUser.email === validEmail.toLowerCase(), 'Returned user email matches normalized email');
    assert(returnedUser.role === ROLES.CUSTOMER, `Returned user role is "${ROLES.CUSTOMER}"`);
    assert(returnedUser.isActive === true, 'Returned user isActive is true');

    // Security assertions on login response
    console.log('\n5. Auditing Response Credential Safety:');
    assert(returnedUser.password === undefined, 'CRITICAL: Plaintext password is NOT in response user object');
    assert(returnedUser.passwordHash === undefined, 'CRITICAL: passwordHash is NOT in response user object');
    assert(loginRes.data.password === undefined, 'Root response does NOT contain password');
    assert(loginRes.data.passwordHash === undefined, 'Root response does NOT contain passwordHash');

    // 6. JWT Structure, Claims & Expiration Verification
    console.log('\n6. Auditing JWT Claims, Signing & Expiration:');
    const secret = authConfig.getJwtSecret();
    const decodedToken = jwt.verify(token, secret);
    assert(Boolean(decodedToken), 'JWT token verifies successfully with configured secret');
    assert(decodedToken.sub === activeTestUser._id.toString(), 'JWT sub claim equals user ID');
    assert(decodedToken.role === ROLES.CUSTOMER, `JWT role claim equals "${ROLES.CUSTOMER}"`);
    assert(decodedToken.password === undefined, 'JWT does NOT contain password');
    assert(decodedToken.passwordHash === undefined, 'JWT does NOT contain passwordHash');
    assert(decodedToken.phone === undefined, 'JWT does NOT contain phone');
    assert(decodedToken.exp !== undefined, 'JWT contains exp (expiration timestamp)');
    assert(decodedToken.iat !== undefined, 'JWT contains iat (issued at timestamp)');
    assert(decodedToken.exp > decodedToken.iat, 'Token expiration is strictly in the future');

    // 7. Authentication Failure Behavior (Constant-time error design)
    console.log('\n7. Auditing Authentication Failure & Enumeration Protection:');

    // Incorrect password
    const wrongPassRes = await makeRequest('/api/auth/login', 'POST', {
      email: validEmail,
      password: 'IncorrectPassword999!'
    });
    assert(wrongPassRes.status === 401, 'Incorrect password returns HTTP 401 Unauthorized');
    assert(wrongPassRes.data.success === false, 'Wrong password response has success: false');
    assert(
      wrongPassRes.data.message === 'Invalid email or password',
      'Wrong password error message is generic: "Invalid email or password"'
    );

    // Non-existent email
    const unknownEmailRes = await makeRequest('/api/auth/login', 'POST', {
      email: `nonexistent-${Date.now()}@heroshowroom.example.com`,
      password: validPassword
    });
    assert(unknownEmailRes.status === 401, 'Non-existent email returns HTTP 401 Unauthorized');
    assert(
      unknownEmailRes.data.message === 'Invalid email or password',
      'Unknown email error message is identical generic message: "Invalid email or password"'
    );
    assert(
      wrongPassRes.data.message === unknownEmailRes.data.message,
      'Error message for wrong password and unknown email are identical (prevents account enumeration)'
    );

    // Inactive user
    const inactiveLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: inactiveEmail,
      password: validPassword
    });
    assert(inactiveLoginRes.status === 401, 'Inactive user login returns HTTP 401 Unauthorized');
    assert(
      inactiveLoginRes.data.message === 'Invalid email or password',
      'Inactive user error message is identical generic message (prevents active status leakage)'
    );

    // 8. Regression Verification: Registration remains functional
    console.log('\n8. Auditing Regression: Registration API after Login Integration:');
    const newRegEmail = `${testEmailPrefix}-regtest@heroshowroom.example.com`;
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Regression Rider',
      email: newRegEmail,
      password: 'StrongPassword123!',
      phone: '+91 99999 88888'
    });
    assert(regRes.status === 201, 'POST /api/auth/register continues to return HTTP 201');
    assert(regRes.data.success === true, 'Registration response remains success: true');

    // Log in with the newly registered user
    const regLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: newRegEmail,
      password: 'StrongPassword123!'
    });
    assert(regLoginRes.status === 200, 'Newly registered user can immediately log in with HTTP 200');
    assert(Boolean(regLoginRes.data.accessToken || regLoginRes.data.data?.accessToken), 'Newly registered user receives accessToken');

  } finally {
    // 9. Cleanup Created Test Users & Teardown
    console.log('\n9. Cleaning Up Test Users & Server Teardown:');
    const deleteResult = await User.deleteMany({ email: new RegExp(`^${testEmailPrefix}`) });
    console.log(`  Purged ${deleteResult.deletedCount} temporary test user(s) created during audit.`);
    server.close();
    await disconnectDatabase();
  }

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 3 STEP 3 LOGIN & JWT AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 LOGIN AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runLoginTests().catch((err) => {
  console.error('Fatal login test error:', err);
  process.exit(1);
});
