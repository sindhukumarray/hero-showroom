const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables for database connection
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User } = require('./src/models');
const { ROLES } = require('./src/constants/roles');

async function runRegisterTests() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 2 REGISTRATION AUDIT  ');
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
  console.log('1. Connecting to Database for Registration Verification:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for registration testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    console.error('Database connection is required for live registration testing.');
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

  const testEmailPrefix = `test-step3b-${Date.now()}`;
  const validEmail = `${testEmailPrefix}-primary@heroshowroom.example.com`;
  const validPassword = 'SecurePassword123!';

  try {
    // 3. Validation Audits (Negative Scenarios)
    console.log('\n3. Auditing Registration Input Validation:');

    // Missing name
    const noNameRes = await makeRequest('/api/auth/register', 'POST', {
      email: `${testEmailPrefix}-noname@example.com`,
      password: validPassword
    });
    assert(noNameRes.status === 400, 'Missing name fails with HTTP 400');
    assert(
      noNameRes.data.errors && noNameRes.data.errors.some((e) => e.includes('name')),
      'Validation error specifies missing name'
    );

    // Name shorter than minimum (1 character)
    const shortNameRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'A',
      email: `${testEmailPrefix}-shortname@example.com`,
      password: validPassword
    });
    assert(shortNameRes.status === 400, 'Name shorter than 2 characters fails with HTTP 400');

    // Name longer than maximum (61 characters)
    const longNameRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'A'.repeat(61),
      email: `${testEmailPrefix}-longname@example.com`,
      password: validPassword
    });
    assert(longNameRes.status === 400, 'Name longer than 60 characters fails with HTTP 400');

    // Missing email
    const noEmailRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Test Rider',
      password: validPassword
    });
    assert(noEmailRes.status === 400, 'Missing email fails with HTTP 400');
    assert(
      noEmailRes.data.errors && noEmailRes.data.errors.some((e) => e.includes('email')),
      'Validation error specifies missing email'
    );

    // Invalid email format
    const badEmailRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Test Rider',
      email: 'not-an-email-address',
      password: validPassword
    });
    assert(badEmailRes.status === 400, 'Invalid email format fails with HTTP 400');

    // Missing password
    const noPasswordRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Test Rider',
      email: `${testEmailPrefix}-nopass@example.com`
    });
    assert(noPasswordRes.status === 400, 'Missing password fails with HTTP 400');

    // Password shorter than 8 characters
    const shortPasswordRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Test Rider',
      email: `${testEmailPrefix}-shortpass@example.com`,
      password: 'short'
    });
    assert(shortPasswordRes.status === 400, 'Password shorter than 8 characters fails with HTTP 400');

    // Password longer than 128 characters
    const longPasswordRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Test Rider',
      email: `${testEmailPrefix}-longpass@example.com`,
      password: 'A'.repeat(129)
    });
    assert(longPasswordRes.status === 400, 'Password longer than 128 characters fails with HTTP 400');

    // Invalid request structure (Array payload)
    const arrayPayloadRes = await makeRequest('/api/auth/register', 'POST', [
      { name: 'Test' }
    ]);
    assert(arrayPayloadRes.status === 400, 'Array request payload is rejected with HTTP 400');

    // MongoDB operator injection attempt
    const operatorInjectionRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Injection Attempt',
      email: `${testEmailPrefix}-injection@example.com`,
      password: validPassword,
      $gt: 'operator'
    });
    assert(operatorInjectionRes.status === 400, 'Payload with MongoDB operator ($gt) is rejected with HTTP 400');

    // 4. Security Audits: Role Escalation & PasswordHash Injection
    console.log('\n4. Auditing Security Controls (Role Escalation & Hash Injections):');

    // Client attempts to supply role: 'admin'
    const roleEscalationRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Sneaky User',
      email: `${testEmailPrefix}-roleescalation@example.com`,
      password: validPassword,
      role: 'admin'
    });
    assert(roleEscalationRes.status === 400, 'Client attempt to supply role: "admin" is rejected with HTTP 400');
    assert(
      roleEscalationRes.data.errors && roleEscalationRes.data.errors.some((e) => e.includes('role')),
      'Error message clarifies role cannot be specified during registration'
    );

    // Client attempts to supply raw passwordHash
    const passwordHashInjectionRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Hash Injector',
      email: `${testEmailPrefix}-hashinject@example.com`,
      password: validPassword,
      passwordHash: '$2b$10$arbitraryprecomputedhash'
    });
    assert(passwordHashInjectionRes.status === 400, 'Client attempt to supply passwordHash is rejected with HTTP 400');

    // 5. Successful Registration Audit
    console.log('\n5. Auditing Successful Registration & Credential Hashing:');
    const registerRes = await makeRequest('/api/auth/register', 'POST', {
      name: '  Official Tester  ',
      email: `  ${validEmail.toUpperCase()}  `,
      password: validPassword,
      phone: '  +91 98765 43210  '
    });

    assert(registerRes.status === 201, 'Valid registration succeeds with HTTP 201 Created');
    assert(registerRes.data.success === true, 'Response contains success: true');
    assert(registerRes.data.message === 'Registration successful', 'Response message is "Registration successful"');

    const returnedUser = registerRes.data.user || registerRes.data.data?.user;
    assert(Boolean(returnedUser), 'Response contains returned user object');
    assert(returnedUser.id !== undefined, 'Returned user includes id');
    assert(returnedUser.name === 'Official Tester', 'User name is properly trimmed in response');
    assert(returnedUser.email === validEmail.toLowerCase(), 'User email is properly normalized and lowercased');
    assert(returnedUser.role === ROLES.CUSTOMER, `User role is strictly forced to "${ROLES.CUSTOMER}"`);
    assert(returnedUser.phone === '+91 98765 43210', 'User phone is preserved and trimmed');
    assert(returnedUser.isActive === true, 'User isActive is true');

    // Credential safety assertions on response
    assert(returnedUser.password === undefined, 'CRITICAL: Plaintext password is NOT in response');
    assert(returnedUser.passwordHash === undefined, 'CRITICAL: passwordHash is NOT in response');
    assert(registerRes.data.password === undefined, 'Root response object has no password');
    assert(registerRes.data.passwordHash === undefined, 'Root response object has no passwordHash');

    // 6. Direct Database Verification
    console.log('\n6. Auditing Database State & Password Hash:');
    const persistedUser = await User.findOne({ email: validEmail.toLowerCase() }).select('+passwordHash');
    assert(Boolean(persistedUser), 'User document is verified in MongoDB');
    assert(persistedUser.name === 'Official Tester', 'Persisted name matches input');
    assert(persistedUser.email === validEmail.toLowerCase(), 'Persisted email is lowercased');
    assert(persistedUser.role === ROLES.CUSTOMER, 'Persisted role in database is customer');
    assert(persistedUser.password === undefined, 'No plaintext "password" property exists on persisted document');

    // Verify bcrypt password hashing
    assert(Boolean(persistedUser.passwordHash), 'Persisted document has passwordHash populated');
    assert(persistedUser.passwordHash !== validPassword, 'passwordHash is NOT stored as plaintext');
    assert(persistedUser.passwordHash.startsWith('$2'), 'passwordHash is formatted as a valid bcrypt hash ($2)');
    const isPasswordMatch = await bcrypt.compare(validPassword, persistedUser.passwordHash);
    assert(isPasswordMatch === true, 'bcrypt.compare validates plaintext password against stored passwordHash');
    const isWrongPasswordMatch = await bcrypt.compare('WrongPassword999', persistedUser.passwordHash);
    assert(isWrongPasswordMatch === false, 'bcrypt.compare rejects incorrect passwords');

    // 7. Duplicate Email Conflict (409) Audit
    console.log('\n7. Auditing Duplicate Email Conflict Handling:');
    const duplicateRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Duplicate Registrant',
      email: validEmail.toLowerCase(),
      password: 'AnotherPassword456!'
    });

    assert(duplicateRes.status === 409, 'Duplicate email registration returns HTTP 409 Conflict');
    assert(duplicateRes.data.success === false, 'Duplicate response has success: false');
    assert(
      duplicateRes.data.message && duplicateRes.data.message.includes('already exists'),
      'Duplicate error message informs user account already exists'
    );
    // Security check: Verify no raw database internals are leaked
    const rawErrorString = JSON.stringify(duplicateRes.data);
    assert(!rawErrorString.includes('E11000'), 'Error message does NOT leak MongoDB E11000 error code');
    assert(!rawErrorString.includes('MongoServerError'), 'Error message does NOT leak MongoServerError class');
    assert(!rawErrorString.includes('index:'), 'Error message does NOT leak database index name');

    // Verify user count did not increase
    const userCount = await User.countDocuments({ email: validEmail.toLowerCase() });
    assert(userCount === 1, 'Duplicate registration attempt did NOT create an additional user in database');

    // 8. Optional Phone Defaults
    console.log('\n8. Auditing Registration Without Phone:');
    const noPhoneEmail = `${testEmailPrefix}-nophone@example.com`;
    const noPhoneRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'No Phone Rider',
      email: noPhoneEmail,
      password: validPassword
    });
    assert(noPhoneRes.status === 201, 'Registration without phone succeeds with HTTP 201');
    const noPhoneUser = noPhoneRes.data.user || noPhoneRes.data.data?.user;
    assert(noPhoneUser.phone === '', 'Phone defaults to empty string when omitted');

  } finally {
    // 9. Cleanup Created Test Users & Teardown
    console.log('\n9. Cleaning Up Test Users & Teardown:');
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
    console.log('\n🎉 ALL PHASE 3 STEP 2 REGISTRATION AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 REGISTRATION AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runRegisterTests().catch((err) => {
  console.error('Fatal registration test error:', err);
  process.exit(1);
});
