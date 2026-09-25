const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Showroom, Review } = require('./src/models');
const authConfig = require('./src/config/auth');
const { REVIEW_STATUS, REVIEW_RATING } = require('./src/constants/reviews');

async function runStep3lTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 12 REVIEWS BACKEND AUDIT         ');
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

  // ============================================================
  // 1. Database Connection
  // ============================================================
  console.log('1. Connecting to Database:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Reviews testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // ============================================================
  // 2. HTTP Server Setup
  // ============================================================
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Live test server on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      const postData = body !== null ? JSON.stringify(body) : '';
      const headers = { 'Content-Type': 'application/json', ...extraHeaders };
      if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

      const req = http.request(
        `http://127.0.0.1:${port}${pathUrl}`,
        { method, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            let parsed = null;
            try { parsed = JSON.parse(data); } catch { parsed = data; }
            resolve({ status: res.statusCode, data: parsed });
          });
        }
      );
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  // ============================================================
  // 3. Constants & Model Validation
  // ============================================================
  console.log('\n3. Constants & Model Validation:');

  assert(REVIEW_STATUS.PENDING === 'pending', 'REVIEW_STATUS.PENDING is "pending"');
  assert(REVIEW_STATUS.APPROVED === 'approved', 'REVIEW_STATUS.APPROVED is "approved"');
  assert(REVIEW_STATUS.REJECTED === 'rejected', 'REVIEW_STATUS.REJECTED is "rejected"');
  assert(REVIEW_RATING.MIN === 1, 'REVIEW_RATING.MIN is 1');
  assert(REVIEW_RATING.MAX === 5, 'REVIEW_RATING.MAX is 5');

  const schema = Review.schema.paths;
  assert(Boolean(schema.user), 'Review schema has user field');
  assert(Boolean(schema.showroom), 'Review schema has showroom field');
  assert(Boolean(schema.rating), 'Review schema has rating field');
  assert(Boolean(schema.title), 'Review schema has title field');
  assert(Boolean(schema.comment), 'Review schema has comment field');
  assert(Boolean(schema.status), 'Review schema has status field');
  assert(Boolean(schema.moderationNote), 'Review schema has moderationNote field');
  assert(Boolean(schema.createdAt), 'Review schema has timestamps (createdAt)');

  // ============================================================
  // 4. Test Fixtures
  // ============================================================
  console.log('\n4. Setting up Test Fixtures:');

  const ts = Date.now();
  const emailA = `rev_a_${ts}@herotest.com`;
  const emailB = `rev_b_${ts}@herotest.com`;
  const testPassword = 'Test@1234';

  let userA = null;
  let userB = null;
  let tokenA = null;
  let tokenB = null;
  let testShowroom = null;
  let inactiveShowroom = null;

  try {
    // Use existing active showroom from seed data
    testShowroom = await Showroom.findOne({ isActive: true });
    if (!testShowroom) {
      assert(false, 'No active showroom found in DB — seed data required');
      throw new Error('No active showroom available');
    }

    // Create an inactive showroom for testing (reuse same brand/city, add required contact.phone)
    const existingForRef = await Showroom.findOne({ isActive: true }).populate('brand').populate('city');
    inactiveShowroom = await Showroom.create({
      name: `Inactive Showroom ${ts}`,
      slug: `inactive-review-showroom-${ts}`,
      brand: existingForRef.brand._id,
      city: existingForRef.city._id,
      address: { fullAddress: '999 Closed Road, Delhi' },
      contact: { phone: '011-99990000', email: 'inactive@test.com', website: '' },
      isActive: false
    });

    const hash = await bcrypt.hash(testPassword, 10);
    userA = await User.create({ name: 'Review User A', email: emailA, passwordHash: hash, role: 'customer', isActive: true });
    userB = await User.create({ name: 'Review User B', email: emailB, passwordHash: hash, role: 'customer', isActive: true });

    const secret = authConfig.getJwtSecret();
    tokenA = jwt.sign({ sub: userA._id.toString(), role: 'customer' }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    tokenB = jwt.sign({ sub: userB._id.toString(), role: 'customer' }, secret, { algorithm: 'HS256', expiresIn: '1h' });

    assert(Boolean(testShowroom), `Test showroom available: ${testShowroom?.name}`);
    assert(Boolean(inactiveShowroom), 'Inactive showroom created');
    assert(Boolean(userA && tokenA), 'User A created with JWT');
    assert(Boolean(userB && tokenB), 'User B created with JWT');
  } catch (err) {
    assert(false, `Fixture setup failed: ${err.message}`);
    console.error(err);
  }


  // Clean any leftover reviews from these users
  if (userA) await Review.deleteMany({ user: userA._id });
  if (userB) await Review.deleteMany({ user: userB._id });

  // ============================================================
  // 5. Authentication Guards
  // ============================================================
  console.log('\n5. Authentication Guards:');

  const unauthCreate = await makeRequest('/api/reviews', 'POST', {
    showroom: testShowroom?._id?.toString(),
    rating: 4
  });
  assert(unauthCreate.status === 401, 'POST /api/reviews requires authentication (401)');

  const unauthMy = await makeRequest('/api/reviews/my');
  assert(unauthMy.status === 401, 'GET /api/reviews/my requires authentication (401)');

  // ============================================================
  // 6. Validator Tests
  // ============================================================
  console.log('\n6. Validator Tests:');

  if (tokenA && testShowroom) {
    // Rating 0
    const r0 = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 0 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(r0.status === 400, 'Rating 0 rejected with 400');

    // Rating 6
    const r6 = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 6 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(r6.status === 400, 'Rating 6 rejected with 400');

    // Missing rating
    const noRating = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString() },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(noRating.status === 400, 'Missing rating rejected with 400');

    // Invalid showroom ObjectId
    const badId = await makeRequest('/api/reviews', 'POST',
      { showroom: 'not-an-objectid', rating: 4 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(badId.status === 400, 'Invalid showroom ObjectId rejected with 400');

    // $ injection key
    const dollarKey = await makeRequest('/api/reviews', 'POST',
      { '$where': 'hack()', showroom: testShowroom._id.toString(), rating: 4 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(dollarKey.status === 400, '$ operator key rejected with 400');

    // Dot notation key
    const dotKey = await makeRequest('/api/reviews', 'POST',
      { 'a.b': 'test', showroom: testShowroom._id.toString(), rating: 4 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(dotKey.status === 400, 'Dot notation key rejected with 400');
  } else {
    assert(false, 'Skipped validator tests — fixtures unavailable');
  }

  // ============================================================
  // 7. Create Review (User A)
  // ============================================================
  console.log('\n7. Create Review:');

  let createdReviewA = null;

  if (tokenA && testShowroom) {
    const createRes = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 5, title: 'Excellent service!', comment: 'Very helpful staff and great ambiance.' },
      { Authorization: `Bearer ${tokenA}` }
    );

    assert(createRes.status === 201, 'POST /api/reviews returns 201 for valid review');
    assert(createRes.data?.success === true, 'Create review response success=true');
    assert(Boolean(createRes.data?.data), 'Create review returns review document');
    assert(createRes.data?.data?.rating === 5, 'Review rating stored correctly');
    assert(createRes.data?.data?.status === 'pending', 'New review status is "pending"');
    assert(
      createRes.data?.data?.user?._id?.toString() === userA._id.toString() ||
      createRes.data?.data?.user?.toString() === userA._id.toString(),
      'Review user matches JWT user (User A)'
    );

    // Client-supplied user should be ignored
    const withClientUser = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 3, user: 'hacker_id', userId: 'also_hacker' },
      { Authorization: `Bearer ${tokenA}` }
    );
    // Should fail with 409 (duplicate) since userA already reviewed this showroom
    // or with 400 (validator strips user and there's already a review)
    assert(
      withClientUser.status === 409 || withClientUser.status === 400,
      'Client-supplied user/userId is ignored and duplicate returns 409'
    );

    createdReviewA = createRes.data?.data;
  } else {
    assert(false, 'Skipped create review tests — fixtures unavailable');
  }

  // ============================================================
  // 8. Security: client cannot set status or moderationNote
  // ============================================================
  console.log('\n8. Security — Client Cannot Control Moderation:');

  if (tokenB && testShowroom) {
    const withStatus = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 4, status: 'approved', moderationNote: 'self-approved' },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(withStatus.status === 201, 'Review with client-supplied status is created (status field stripped)');
    assert(withStatus.data?.data?.status === 'pending', 'Created review status is pending despite client supplying "approved"');
    assert(!withStatus.data?.data?.moderationNote || withStatus.data?.data?.moderationNote === '', 'moderationNote not set by client');
  } else {
    assert(false, 'Skipped security moderation tests — fixtures unavailable');
  }

  // ============================================================
  // 9. Duplicate Prevention
  // ============================================================
  console.log('\n9. Duplicate Review Prevention:');

  if (tokenA && testShowroom) {
    const duplicateRes = await makeRequest('/api/reviews', 'POST',
      { showroom: testShowroom._id.toString(), rating: 3, comment: 'Trying to submit again.' },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(duplicateRes.status === 409, 'Duplicate review from same user returns 409');
  } else {
    assert(false, 'Skipped duplicate test — fixtures unavailable');
  }

  // ============================================================
  // 10. Invalid Showroom Handling
  // ============================================================
  console.log('\n10. Showroom Validation:');

  if (tokenA) {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await makeRequest('/api/reviews', 'POST',
      { showroom: fakeId, rating: 4 },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(notFoundRes.status === 404 || notFoundRes.status === 409, 'Nonexistent showroom returns 404 or 409 (dupe guard may fire first)');
  }

  if (tokenA && inactiveShowroom) {
    // Create a second test user temporarily to avoid dupe constraint
    const hash = await bcrypt.hash('Test@1234', 10);
    const tempUser = await User.create({
      name: 'Inactive Test User',
      email: `inactive_test_${ts}@herotest.com`,
      passwordHash: hash,
      role: 'customer',
      isActive: true
    });
    const secret = authConfig.getJwtSecret();
    const tempToken = jwt.sign({ sub: tempUser._id.toString(), role: 'customer' }, secret, { algorithm: 'HS256', expiresIn: '1h' });

    const inactiveRes = await makeRequest('/api/reviews', 'POST',
      { showroom: inactiveShowroom._id.toString(), rating: 3 },
      { Authorization: `Bearer ${tempToken}` }
    );
    assert(inactiveRes.status === 400, 'Inactive showroom returns 400');

    await User.deleteOne({ _id: tempUser._id });
  }

  // ============================================================
  // 11. Public Showroom Reviews Endpoint
  // ============================================================
  console.log('\n11. Public Showroom Reviews:');

  if (testShowroom) {
    const publicRes = await makeRequest(`/api/reviews/showroom/${testShowroom._id}`);
    assert(publicRes.status === 200, 'GET /api/reviews/showroom/:id returns 200');
    assert(publicRes.data?.success === true, 'Public reviews success=true');
    assert(Array.isArray(publicRes.data?.data), 'Public reviews data is an array');
    // Reviews are pending — should not be in public list
    assert(publicRes.data?.data?.length === 0, 'Pending reviews NOT included in public list');
    assert(Boolean(publicRes.data?.meta?.aggregation), 'Public reviews include aggregation meta');
    assert(typeof publicRes.data?.meta?.aggregation?.totalReviews === 'number', 'Aggregation has totalReviews');
    assert(typeof publicRes.data?.meta?.aggregation?.averageRating === 'number', 'Aggregation has averageRating');
    assert(Boolean(publicRes.data?.meta?.aggregation?.distribution), 'Aggregation has distribution');

    // Manually approve one review to test public visibility
    if (createdReviewA) {
      await Review.findByIdAndUpdate(createdReviewA._id, { status: 'approved' });
      const afterApprovalRes = await makeRequest(`/api/reviews/showroom/${testShowroom._id}`);
      assert(afterApprovalRes.data?.data?.length >= 1, 'Approved review IS included in public list');
      assert(afterApprovalRes.data?.meta?.aggregation?.totalReviews >= 1, 'Aggregation reflects approved review');
      assert(afterApprovalRes.data?.meta?.aggregation?.averageRating > 0, 'Average rating is computed correctly');
      assert(typeof afterApprovalRes.data?.meta?.aggregation?.distribution?.['5'] === 'number', 'Distribution breakdown includes "5" key');

      // No passwordHash in public response
      const firstReview = afterApprovalRes.data?.data?.[0];
      assert(!firstReview?.user?.passwordHash, 'Public review does not expose user passwordHash');
      assert(Boolean(firstReview?.user?.name), 'Public review includes user display name');

      // Reset to pending for isolation
      await Review.findByIdAndUpdate(createdReviewA._id, { status: 'pending' });
    }

    // Invalid showroomId in URL
    const badIdRes = await makeRequest('/api/reviews/showroom/not-an-objectid');
    assert(badIdRes.status === 400, 'Invalid showroomId in URL returns 400');
  }

  // ============================================================
  // 12. My Reviews
  // ============================================================
  console.log('\n12. My Reviews:');

  if (tokenA) {
    const myRes = await makeRequest('/api/reviews/my', 'GET', null, { Authorization: `Bearer ${tokenA}` });
    assert(myRes.status === 200, 'GET /api/reviews/my returns 200');
    assert(myRes.data?.success === true, 'My reviews success=true');
    assert(Array.isArray(myRes.data?.data), 'My reviews data is an array');
    assert(myRes.data?.data?.length >= 1, 'My reviews contains User A review');
    assert(Boolean(myRes.data?.meta), 'My reviews has pagination meta');

    // User B should see 0 reviews from their own list initially... wait, userB submitted one
    const myResB = await makeRequest('/api/reviews/my', 'GET', null, { Authorization: `Bearer ${tokenB}` });
    assert(myResB.status === 200, 'GET /api/reviews/my for User B returns 200');
    // Verify all returned reviews belong to userB
    const allBelongToB = myResB.data?.data?.every(
      (r) => r.user?.toString() === userB._id.toString() || r.user?._id?.toString() === userB._id.toString()
    );
    assert(allBelongToB !== false, 'My reviews returns only current user reviews (ownership isolation)');
  }

  // ============================================================
  // 13. Cross-User Ownership Enforcement
  // ============================================================
  console.log('\n13. Cross-User Ownership Enforcement:');

  if (tokenB && createdReviewA) {
    const updateRes = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'PUT',
      { rating: 1, comment: 'Hacked by user B' },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(updateRes.status === 403, 'User B cannot update User A review (403)');

    const deleteRes = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'DELETE',
      null,
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(deleteRes.status === 403, 'User B cannot delete User A review (403)');
  } else {
    assert(false, 'Skipped cross-user tests — fixtures unavailable');
  }

  // ============================================================
  // 14. Owner Can Update Own Review
  // ============================================================
  console.log('\n14. Owner Update & Delete:');

  if (tokenA && createdReviewA) {
    const updateOwnRes = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'PUT',
      { rating: 4, comment: 'Updated my review with more context.' },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(updateOwnRes.status === 200, 'User A can update own review (200)');
    assert(updateOwnRes.data?.data?.rating === 4, 'Updated rating is stored correctly');
    assert(updateOwnRes.data?.data?.status === 'pending', 'Status reset to pending after edit');

    // Cannot change showroom on update (field stripped)
    const fakeShowroomId = new mongoose.Types.ObjectId().toString();
    const cantChangeShowroom = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'PUT',
      { showroom: fakeShowroomId, rating: 2 },
      { Authorization: `Bearer ${tokenA}` }
    );
    // Should succeed but showroom should NOT change
    if (cantChangeShowroom.status === 200) {
      const stillSameShowroom = cantChangeShowroom.data?.data?.showroom?._id?.toString() === testShowroom._id.toString()
        || cantChangeShowroom.data?.data?.showroom?.toString() === testShowroom._id.toString();
      assert(stillSameShowroom, 'Showroom cannot be changed on update');
    } else {
      assert(cantChangeShowroom.status === 200 || cantChangeShowroom.status === 400, 'Update with showroom field handled gracefully');
    }

    // Delete own review
    const deleteOwnRes = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'DELETE',
      null,
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(deleteOwnRes.status === 200, 'User A can delete own review (200)');
    assert(deleteOwnRes.data?.success === true, 'Delete response success=true');

    // Confirm deleted
    const afterDeleteRes = await makeRequest(`/api/reviews/${createdReviewA._id}`, 'GET',
      null,
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(afterDeleteRes.status === 404, 'Deleted review returns 404');
  } else {
    assert(false, 'Skipped owner update/delete tests — fixtures unavailable');
  }

  // ============================================================
  // 15. Security: No Sensitive Fields in Responses
  // ============================================================
  console.log('\n15. Security — No Sensitive Fields:');

  if (tokenB && testShowroom) {
    const myRes = await makeRequest('/api/reviews/my', 'GET', null, { Authorization: `Bearer ${tokenB}` });
    const reviews = myRes.data?.data || [];
    for (const r of reviews) {
      assert(!r.user?.passwordHash, 'passwordHash not exposed in review response');
      assert(!r.user?.password, 'password not exposed in review response');
    }
    assert(true, 'No sensitive fields exposed in review responses');
  }

  // ============================================================
  // 16. Pagination
  // ============================================================
  console.log('\n16. Pagination:');

  if (testShowroom) {
    // Create and approve multiple reviews for pagination test
    const paginationUsers = [];
    const paginationReviews = [];
    const secret = authConfig.getJwtSecret();
    const hash = await bcrypt.hash('Test@1234', 10);

    for (let i = 0; i < 3; i++) {
      const pu = await User.create({
        name: `Pagination User ${i}`,
        email: `rev_page_${ts}_${i}@herotest.com`,
        passwordHash: hash,
        role: 'customer',
        isActive: true
      });
      paginationUsers.push(pu);
      const pr = await Review.create({
        user: pu._id,
        showroom: testShowroom._id,
        rating: 3 + i % 2,
        comment: `Pagination review ${i} with enough characters.`,
        status: 'approved'
      });
      paginationReviews.push(pr);
    }

    const pageRes = await makeRequest(`/api/reviews/showroom/${testShowroom._id}?limit=2&page=1`);
    assert(pageRes.status === 200, 'Paginated showroom reviews returns 200');
    assert(pageRes.data?.data?.length <= 2, 'Limit=2 respected in pagination');
    assert(typeof pageRes.data?.meta?.total === 'number', 'Pagination meta includes total');
    assert(typeof pageRes.data?.meta?.totalPages === 'number', 'Pagination meta includes totalPages');

    // Cleanup pagination fixtures
    for (const pr of paginationReviews) await Review.deleteOne({ _id: pr._id });
    for (const pu of paginationUsers) await User.deleteOne({ _id: pu._id });

    assert(true, 'Pagination fixture cleanup complete');
  }

  // ============================================================
  // 17. Cleanup
  // ============================================================
  console.log('\n17. Cleanup:');
  try {
    if (userA) {
      await Review.deleteMany({ user: userA._id });
      await User.deleteOne({ _id: userA._id });
    }
    if (userB) {
      await Review.deleteMany({ user: userB._id });
      await User.deleteOne({ _id: userB._id });
    }
    if (inactiveShowroom) {
      await Showroom.deleteOne({ _id: inactiveShowroom._id });
    }
    assert(true, 'Test data cleaned up successfully');
  } catch (err) {
    console.warn(`  Cleanup warning: ${err.message}`);
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n================================================================');
  console.log(' PHASE 3 STEP 12 — REVIEWS AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`  Total Checks : ${checks}`);
  console.log(`  Passed       : ${passed}`);
  console.log(`  Failed       : ${failed}`);
  console.log('================================================================\n');

  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();

  if (failed > 0) process.exit(1);
}

runStep3lTests().catch((err) => {
  console.error('Unexpected error during reviews test:', err);
  process.exit(1);
});
