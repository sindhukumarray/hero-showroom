const mongoose = require('mongoose');
const UserDirect = require('./src/models/User');
const { User, Brand, City, Showroom, Bike, BikeVariant } = require('./src/models');
const { ROLES, ALLOWED_ROLES } = require('./src/constants/roles');
const authConfig = require('./src/config/auth');

async function runUserModelTests() {
  console.log('=====================================================');
  console.log('  HERO SHOWROOM — PHASE 3 STEP 1 USER MODEL AUDIT    ');
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

  // 1. Verify User Model Import & Integration with Index
  console.log('1. Auditing User Model Imports:');
  assert(Boolean(UserDirect), 'User model imported directly from models/User.js');
  assert(Boolean(User), 'User model imported from models/index.js');
  assert(UserDirect === User, 'Direct User import and barrel User export refer to same model');
  assert(Boolean(Brand) && Boolean(City) && Boolean(Showroom) && Boolean(Bike) && Boolean(BikeVariant),
    'Existing models remain available from models/index.js');

  // 2. Verify Schema Definition & Timestamps
  console.log('\n2. Auditing Schema Structure & Timestamps:');
  assert(Boolean(User.schema), 'User model has a valid Mongoose schema');
  assert(User.schema.options.timestamps === true, 'User schema has timestamps enabled (createdAt, updatedAt)');

  // 3. Verify Required Fields Definition
  console.log('\n3. Auditing Required Schema Paths:');
  assert(User.schema.path('name').isRequired === true, 'User.name is marked as required in schema');
  assert(User.schema.path('email').isRequired === true, 'User.email is marked as required in schema');
  assert(User.schema.path('passwordHash').isRequired === true, 'User.passwordHash is marked as required in schema');

  // 4. Verify Plaintext Password is NOT Part of Schema
  console.log('\n4. Auditing Credential Safety (No plaintext password path):');
  assert(User.schema.path('password') === undefined, 'Plaintext "password" field does NOT exist in schema');
  assert(User.schema.path('passwordHash') !== undefined, 'Persisted credential field is named "passwordHash"');

  // 5. Verify Field Defaults
  console.log('\n5. Auditing Field Defaults:');
  const defaultUser = new User();
  assert(defaultUser.role === ROLES.CUSTOMER, `User.role defaults to "${ROLES.CUSTOMER}"`);
  assert(defaultUser.isActive === true, 'User.isActive defaults to true');
  assert(defaultUser.phone === '', 'User.phone defaults to empty string');

  // 6. Verify Email Lowercasing, Trimming & Uniqueness
  console.log('\n6. Auditing Email Normalization & Indexing:');
  assert(User.schema.path('email').options.lowercase === true, 'User.email has lowercase: true option');
  assert(User.schema.path('email').options.trim === true, 'User.email has trim: true option');
  assert(User.schema.path('email').options.unique === true, 'User.email has unique: true index configured');

  const testUser = new User({
    name: '  Test Rider  ',
    email: '  RIDER.ONE@HeroShowroom.COM  ',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz012345'
  });
  assert(testUser.email === 'rider.one@heroshowroom.com', 'Email is automatically lowercased and trimmed upon assignment');
  assert(testUser.name === 'Test Rider', 'Name is automatically trimmed upon assignment');

  // 7. Verify Validation on Missing Required Fields
  console.log('\n7. Auditing Validation on Incomplete Documents:');
  const emptyDoc = new User({});
  const validationError = emptyDoc.validateSync();
  assert(Boolean(validationError), 'validateSync() fails for an empty user document');
  assert(Boolean(validationError.errors.name), 'Validation error includes "name"');
  assert(Boolean(validationError.errors.email), 'Validation error includes "email"');
  assert(Boolean(validationError.errors.passwordHash), 'Validation error includes "passwordHash"');

  // 8. Verify Name Length Validation
  console.log('\n8. Auditing Name Length Boundaries:');
  const shortNameUser = new User({
    name: 'A',
    email: 'valid@example.com',
    passwordHash: 'hash123'
  });
  const shortErr = shortNameUser.validateSync();
  assert(Boolean(shortErr?.errors?.name), 'Name shorter than 2 characters is rejected by validation');

  const longNameUser = new User({
    name: 'A'.repeat(61),
    email: 'valid@example.com',
    passwordHash: 'hash123'
  });
  const longErr = longNameUser.validateSync();
  assert(Boolean(longErr?.errors?.name), 'Name longer than 60 characters is rejected by validation');

  // 9. Verify Email Format Validation
  console.log('\n9. Auditing Email Format Validation:');
  const invalidEmailUser = new User({
    name: 'Valid Name',
    email: 'invalid-email-string',
    passwordHash: 'hash123'
  });
  const emailErr = invalidEmailUser.validateSync();
  assert(Boolean(emailErr?.errors?.email), 'Invalid email format is rejected by email regex validator');

  const validEmailUser = new User({
    name: 'Valid Name',
    email: 'customer@example.com',
    passwordHash: 'hash123'
  });
  const validEmailErr = validEmailUser.validateSync();
  assert(!validEmailErr?.errors?.email, 'Properly formatted email passes validation');

  // 10. Verify Role Enum Validation
  console.log('\n10. Auditing Role Enum Validation:');
  const customerUser = new User({
    name: 'Customer User',
    email: 'cust@example.com',
    passwordHash: 'hash123',
    role: ROLES.CUSTOMER
  });
  assert(!customerUser.validateSync()?.errors?.role, `Role "${ROLES.CUSTOMER}" is accepted`);

  const adminUser = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: 'hash123',
    role: ROLES.ADMIN
  });
  assert(!adminUser.validateSync()?.errors?.role, `Role "${ROLES.ADMIN}" is accepted`);

  const invalidRoleUser = new User({
    name: 'Bad Role',
    email: 'bad@example.com',
    passwordHash: 'hash123',
    role: 'superadmin'
  });
  const roleErr = invalidRoleUser.validateSync();
  assert(Boolean(roleErr?.errors?.role), 'Unrecognized role "superadmin" is rejected by enum validation');

  // 11. Verify toJSON Transform Sanitization
  console.log('\n11. Auditing toJSON Security Serialization:');
  const fullUser = new User({
    name: 'Secure Rider',
    email: 'secure@example.com',
    passwordHash: '$2b$10$secretHashStringThatShouldNeverBeSerialized',
    role: ROLES.CUSTOMER
  });
  const jsonOutput = fullUser.toJSON();
  assert(jsonOutput.passwordHash === undefined, 'toJSON output strips passwordHash for response safety');
  assert(jsonOutput.name === 'Secure Rider', 'toJSON retains public user fields');
  assert(jsonOutput.email === 'secure@example.com', 'toJSON retains public email field');

  // 12. Verify Auth Configuration Foundation
  console.log('\n12. Auditing Auth Configuration Module:');
  assert(typeof authConfig === 'object', 'authConfig is an object');
  assert(authConfig.jwtExpiresIn !== undefined, 'authConfig defines jwtExpiresIn');
  assert(typeof authConfig.jwtExpiresIn === 'string', 'jwtExpiresIn is a string (e.g. "7d")');
  assert(authConfig.jwtSecret !== undefined, 'authConfig reads jwtSecret from environment');

  // 13. Verify Role Constants
  console.log('\n13. Auditing Role Constants Module:');
  assert(ROLES.CUSTOMER === 'customer', 'ROLES.CUSTOMER equals "customer"');
  assert(ROLES.ADMIN === 'admin', 'ROLES.ADMIN equals "admin"');
  assert(Array.isArray(ALLOWED_ROLES), 'ALLOWED_ROLES is an array');
  assert(ALLOWED_ROLES.includes('customer') && ALLOWED_ROLES.includes('admin'),
    'ALLOWED_ROLES contains both "customer" and "admin"');

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 3 STEP 1 USER MODEL AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runUserModelTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
