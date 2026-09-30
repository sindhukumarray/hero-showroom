const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');
const { User, Showroom, Bike, BikeVariant, Offer, Lead, TestRide, Review, Notification } = require('./src/models');
const authConfig = require('./src/config/auth');
const { NOTIFICATION_TYPES, ALLOWED_NOTIFICATION_TYPES } = require('./src/constants/notifications');

async function runStep3mTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 13 NOTIFICATIONS BACKEND AUDIT   ');
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
    assert(isConnected(), 'Database connected successfully for Notifications testing');
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
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            resolve({ status: res.statusCode, body: parsed, headers: res.headers });
          });
        }
      );
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  // ============================================================
  // 3. Constants & Model Structure
  // ============================================================
  console.log('\n3. Constants & Model Schema Validation:');
  assert(NOTIFICATION_TYPES.LEAD === 'LEAD', 'NOTIFICATION_TYPES.LEAD is "LEAD"');
  assert(NOTIFICATION_TYPES.TEST_RIDE === 'TEST_RIDE', 'NOTIFICATION_TYPES.TEST_RIDE is "TEST_RIDE"');
  assert(NOTIFICATION_TYPES.OFFER === 'OFFER', 'NOTIFICATION_TYPES.OFFER is "OFFER"');
  assert(NOTIFICATION_TYPES.REVIEW === 'REVIEW', 'NOTIFICATION_TYPES.REVIEW is "REVIEW"');
  assert(NOTIFICATION_TYPES.SYSTEM === 'SYSTEM', 'NOTIFICATION_TYPES.SYSTEM is "SYSTEM"');
  assert(ALLOWED_NOTIFICATION_TYPES.length === 5, 'Allowed notification types array has 5 types');

  const schema = Notification.schema.paths;
  assert(Boolean(schema.user), 'Notification schema has user field');
  assert(Boolean(schema.type), 'Notification schema has type field');
  assert(Boolean(schema.title), 'Notification schema has title field');
  assert(Boolean(schema.message), 'Notification schema has message field');
  assert(Boolean(schema.isRead), 'Notification schema has isRead field');
  assert(Boolean(schema.relatedEntity), 'Notification schema has relatedEntity field');
  assert(Boolean(schema.relatedEntityType), 'Notification schema has relatedEntityType field');
  assert(Boolean(schema.metadata), 'Notification schema has metadata field');
  assert(Boolean(schema.createdAt), 'Notification schema has createdAt timestamp');

  // ============================================================
  // 4. Test Fixtures (Users, Showrooms, Bikes, Offers)
  // ============================================================
  console.log('\n4. Setting up Test Fixtures:');
  const secret = authConfig.getJwtSecret();
  const testSuffix = Math.random().toString(36).substring(2, 8);

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const userA = await User.create({
    name: 'Notification User A',
    email: `notif_user_a_${testSuffix}@example.com`,
    passwordHash,
    role: 'customer',
    isActive: true
  });
  const tokenA = jwt.sign({ sub: userA._id.toString(), role: userA.role }, secret, { expiresIn: '1h' });

  const userB = await User.create({
    name: 'Notification User B',
    email: `notif_user_b_${testSuffix}@example.com`,
    passwordHash,
    role: 'customer',
    isActive: true
  });
  const tokenB = jwt.sign({ sub: userB._id.toString(), role: userB.role }, secret, { expiresIn: '1h' });

  assert(Boolean(userA && tokenA), 'User A fixture created with valid JWT');
  assert(Boolean(userB && tokenB), 'User B fixture created with valid JWT');

  // Retrieve an existing showroom and bike
  let testShowroom = await Showroom.findOne({ isActive: true });
  let testBike = await Bike.findOne({ isActive: true });
  assert(Boolean(testShowroom), `Test showroom available: ${testShowroom?.name}`);
  assert(Boolean(testBike), `Test bike available: ${testBike?.name}`);

  // ============================================================
  // 5. Authentication Guards
  // ============================================================
  console.log('\n5. Authentication Guards:');
  const unauthList = await makeRequest('/api/notifications');
  assert(unauthList.status === 401, 'GET /api/notifications unauthenticated returns 401');

  const unauthUnread = await makeRequest('/api/notifications/unread-count');
  assert(unauthUnread.status === 401, 'GET /api/notifications/unread-count unauthenticated returns 401');

  const unauthReadAll = await makeRequest('/api/notifications/read-all', 'PATCH');
  assert(unauthReadAll.status === 401, 'PATCH /api/notifications/read-all unauthenticated returns 401');

  const fakeId = new mongoose.Types.ObjectId().toString();
  const unauthReadOne = await makeRequest(`/api/notifications/${fakeId}/read`, 'PATCH');
  assert(unauthReadOne.status === 401, 'PATCH /api/notifications/:id/read unauthenticated returns 401');

  const unauthDelete = await makeRequest(`/api/notifications/${fakeId}`, 'DELETE');
  assert(unauthDelete.status === 401, 'DELETE /api/notifications/:id unauthenticated returns 401');

  // ============================================================
  // 6. Validator Tests
  // ============================================================
  console.log('\n6. Validator Tests:');
  const invalidIdRes = await makeRequest(
    '/api/notifications/not-a-valid-id/read',
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(invalidIdRes.status === 400, 'Invalid ObjectId in :id returns 400');
  assert(invalidIdRes.body.success === false, 'Invalid ObjectId returns success=false');

  const invalidPageRes = await makeRequest(
    '/api/notifications?page=invalid',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(invalidPageRes.status === 400, 'Invalid page parameter returns 400');

  const negativeLimitRes = await makeRequest(
    '/api/notifications?limit=-5',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(negativeLimitRes.status === 400, 'Negative limit parameter returns 400');

  const invalidTypeRes = await makeRequest(
    '/api/notifications?type=INVALID_TYPE',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(invalidTypeRes.status === 400, 'Invalid notification type query filter returns 400');

  const operatorInjectionRes = await makeRequest(
    '/api/notifications?$where=malicious',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(operatorInjectionRes.status === 400, 'MongoDB operator key in query parameters returns 400');

  // ============================================================
  // 7. Initial Empty Notification State & Unread Count
  // ============================================================
  console.log('\n7. Initial Notification State & Unread Count:');
  const initList = await makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(initList.status === 200, 'GET /api/notifications returns 200');
  assert(initList.body.success === true, 'Initial notifications response success=true');
  assert(Array.isArray(initList.body.data), 'Notifications data is an array');
  assert(initList.body.data.length === 0, 'Initial notification array is empty for User A');
  assert(initList.body.meta.total === 0, 'Meta total is 0');
  assert(initList.body.meta.unreadCount === 0, 'Meta unreadCount is 0');

  const initUnreadRes = await makeRequest('/api/notifications/unread-count', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(initUnreadRes.status === 200, 'GET /api/notifications/unread-count returns 200');
  assert(initUnreadRes.body.data.unreadCount === 0, 'Unread count is 0 initially');

  // ============================================================
  // 8. Workflow Integration: Lead Enquiry Creates Notification
  // ============================================================
  console.log('\n8. Workflow Integration — Lead Enquiry Notification:');
  const leadRes = await makeRequest(
    '/api/leads',
    'POST',
    {
      name: 'Aarav Lead',
      email: userA.email,
      phone: '+91 98765 43210',
      showroom: testShowroom._id.toString(),
      bike: testBike._id.toString(),
      message: 'Looking for prompt test ride and quotation'
    },
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(leadRes.status === 201, 'POST /api/leads creates lead successfully (201)');
  assert(leadRes.body.success === true, 'Lead creation returns success=true');

  // Check that notification was automatically generated
  const postLeadNotifs = await makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(postLeadNotifs.status === 200, 'GET /api/notifications after lead returns 200');
  assert(postLeadNotifs.body.data.length === 1, 'User A now has exactly 1 notification');
  const leadNotif = postLeadNotifs.body.data[0];
  assert(leadNotif.type === NOTIFICATION_TYPES.LEAD, 'Notification type is LEAD');
  assert(leadNotif.isRead === false, 'Notification isRead is false');
  assert(leadNotif.title.includes('Enquiry'), 'Notification title describes enquiry');
  assert(leadNotif.metadata.bikeName === testBike.name, 'Notification metadata includes bikeName');

  // Verify unread count increased to 1
  const unreadCountAfterLead = await makeRequest('/api/notifications/unread-count', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(unreadCountAfterLead.body.data.unreadCount === 1, 'Unread count increased to 1');

  // ============================================================
  // 9. Workflow Integration: Test Ride Booking Creates Notification
  // ============================================================
  console.log('\n9. Workflow Integration — Test Ride Booking Notification:');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const preferredDateStr = tomorrow.toISOString().split('T')[0];

  const testRideRes = await makeRequest(
    '/api/test-rides',
    'POST',
    {
      name: 'Aarav Rider',
      email: userA.email,
      phone: '9876543210',
      showroom: testShowroom._id.toString(),
      bike: testBike._id.toString(),
      preferredDate: preferredDateStr,
      preferredTime: '11:00',
      notes: 'Please keep helmet ready'
    },
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(testRideRes.status === 201, 'POST /api/test-rides creates test ride (201)');
  assert(testRideRes.body.success === true, 'Test ride creation returns success=true');

  const postRideNotifs = await makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(postRideNotifs.body.data.length === 2, 'User A now has 2 notifications');
  const rideNotif = postRideNotifs.body.data[0]; // Newest first
  assert(rideNotif.type === NOTIFICATION_TYPES.TEST_RIDE, 'Latest notification type is TEST_RIDE');
  assert(rideNotif.title.includes('Test Ride'), 'Notification title describes test ride');
  assert(rideNotif.isRead === false, 'Test ride notification isRead is false');

  // ============================================================
  // 10. Workflow Integration: Showroom Review Creates Notification
  // ============================================================
  console.log('\n10. Workflow Integration — Showroom Review Notification:');
  const reviewRes = await makeRequest(
    '/api/reviews',
    'POST',
    {
      showroom: testShowroom._id.toString(),
      rating: 5,
      title: 'Superb Flagship Experience',
      comment: 'The sales advisors were extremely knowledgeable and courteous.'
    },
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(reviewRes.status === 201, 'POST /api/reviews creates review (201)');
  assert(reviewRes.body.success === true, 'Review creation returns success=true');

  const postReviewNotifs = await makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(postReviewNotifs.body.data.length === 3, 'User A now has 3 notifications');
  const reviewNotif = postReviewNotifs.body.data[0];
  assert(reviewNotif.type === NOTIFICATION_TYPES.REVIEW, 'Latest notification type is REVIEW');
  assert(reviewNotif.title.includes('Review'), 'Notification title describes review');

  // Unread count should now be 3
  const unread3Res = await makeRequest('/api/notifications/unread-count', 'GET', null, { Authorization: `Bearer ${tokenA}` });
  assert(unread3Res.body.data.unreadCount === 3, 'Unread count is now 3');

  // ============================================================
  // 11. Pagination & Filtering
  // ============================================================
  console.log('\n11. Pagination & Filtering:');
  const page1Res = await makeRequest(
    '/api/notifications?page=1&limit=2',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(page1Res.status === 200, 'Paginated query returns 200');
  assert(page1Res.body.data.length === 2, 'Page limit of 2 is respected');
  assert(page1Res.body.meta.page === 1, 'Meta page is 1');
  assert(page1Res.body.meta.limit === 2, 'Meta limit is 2');
  assert(page1Res.body.meta.total === 3, 'Meta total is 3');
  assert(page1Res.body.meta.totalPages === 2, 'Meta totalPages is 2');

  const typeFilterRes = await makeRequest(
    '/api/notifications?type=LEAD',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(typeFilterRes.status === 200, 'Filter by type=LEAD returns 200');
  assert(typeFilterRes.body.data.length === 1, 'Exactly 1 LEAD notification returned');
  assert(typeFilterRes.body.data[0].type === NOTIFICATION_TYPES.LEAD, 'Returned notification type is LEAD');

  const unreadFilterRes = await makeRequest(
    '/api/notifications?isRead=false',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(unreadFilterRes.status === 200, 'Filter by isRead=false returns 200');
  assert(unreadFilterRes.body.data.length === 3, 'All 3 unread notifications returned');

  const readFilterRes = await makeRequest(
    '/api/notifications?isRead=true',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(readFilterRes.status === 200, 'Filter by isRead=true returns 200');
  assert(readFilterRes.body.data.length === 0, 'No read notifications returned initially');

  // ============================================================
  // 12. Mark Single Notification as Read
  // ============================================================
  console.log('\n12. Mark Single Notification as Read:');
  const notifToRead = postReviewNotifs.body.data[0];
  const markReadRes = await makeRequest(
    `/api/notifications/${notifToRead._id}/read`,
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returns 200');
  assert(markReadRes.body.success === true, 'Mark read returns success=true');
  assert(markReadRes.body.data.isRead === true, 'Returned notification has isRead=true');

  // Verify unread count decreased from 3 to 2
  const unreadAfterOneRes = await makeRequest(
    '/api/notifications/unread-count',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(unreadAfterOneRes.body.data.unreadCount === 2, 'Unread count decreased to 2');

  // Idempotency: marking read again should succeed without error
  const repeatMarkReadRes = await makeRequest(
    `/api/notifications/${notifToRead._id}/read`,
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(repeatMarkReadRes.status === 200, 'Repeated mark as read is idempotent (200)');
  assert(repeatMarkReadRes.body.data.isRead === true, 'isRead remains true');

  // ============================================================
  // 13. Ownership Isolation & Access Protection
  // ============================================================
  console.log('\n13. Ownership Isolation & Tenant Security:');
  // User B lists notifications (should see 0)
  const userBListRes = await makeRequest(
    '/api/notifications',
    'GET',
    null,
    { Authorization: `Bearer ${tokenB}` }
  );
  assert(userBListRes.status === 200, 'User B list notifications returns 200');
  assert(userBListRes.body.data.length === 0, 'User B sees 0 notifications (User A notifications isolated)');

  const userBUnreadRes = await makeRequest(
    '/api/notifications/unread-count',
    'GET',
    null,
    { Authorization: `Bearer ${tokenB}` }
  );
  assert(userBUnreadRes.body.data.unreadCount === 0, 'User B unread count is 0');

  // User B attempts to mark User A's notification as read (forbidden)
  const userBCrossModifyRes = await makeRequest(
    `/api/notifications/${notifToRead._id}/read`,
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenB}` }
  );
  assert(userBCrossModifyRes.status === 403, 'User B cannot mark User A notification as read (403 Forbidden)');

  // User B attempts to delete User A's notification (forbidden)
  const userBCrossDeleteRes = await makeRequest(
    `/api/notifications/${notifToRead._id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${tokenB}` }
  );
  assert(userBCrossDeleteRes.status === 403, 'User B cannot delete User A notification (403 Forbidden)');

  // ============================================================
  // 14. Mark All Notifications as Read
  // ============================================================
  console.log('\n14. Mark All Notifications as Read:');
  const markAllRes = await makeRequest(
    '/api/notifications/read-all',
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(markAllRes.status === 200, 'PATCH /api/notifications/read-all returns 200');
  assert(markAllRes.body.success === true, 'Mark all as read returns success=true');

  const unreadAfterAllRes = await makeRequest(
    '/api/notifications/unread-count',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(unreadAfterAllRes.body.data.unreadCount === 0, 'Unread count is now 0 for User A');

  // Check all are isRead: true in listing
  const allNotifsRes = await makeRequest(
    '/api/notifications',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  const allRead = allNotifsRes.body.data.every((n) => n.isRead === true);
  assert(allRead, 'All User A notifications now have isRead=true');

  // ============================================================
  // 15. Delete Notification
  // ============================================================
  console.log('\n15. Delete Notification:');
  const notifToDelete = allNotifsRes.body.data[0];
  const deleteRes = await makeRequest(
    `/api/notifications/${notifToDelete._id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(deleteRes.status === 200, 'DELETE /api/notifications/:id returns 200');
  assert(deleteRes.body.success === true, 'Delete returns success=true');

  const listAfterDelete = await makeRequest(
    '/api/notifications',
    'GET',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(listAfterDelete.body.data.length === 2, 'Notifications count decreased from 3 to 2 after deletion');

  // Deleting again should return 404
  const repeatDeleteRes = await makeRequest(
    `/api/notifications/${notifToDelete._id}`,
    'DELETE',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(repeatDeleteRes.status === 404, 'Deleting already deleted notification returns 404');

  // Nonexistent ID for read returns 404
  const nonExistentReadRes = await makeRequest(
    `/api/notifications/${new mongoose.Types.ObjectId().toString()}/read`,
    'PATCH',
    null,
    { Authorization: `Bearer ${tokenA}` }
  );
  assert(nonExistentReadRes.status === 404, 'Marking nonexistent notification returns 404');

  // ============================================================
  // 16. Cleanup
  // ============================================================
  console.log('\n16. Cleanup:');
  await Notification.deleteMany({ user: { $in: [userA._id, userB._id] } });
  await Lead.deleteMany({ user: userA._id });
  await TestRide.deleteMany({ user: userA._id });
  await Review.deleteMany({ user: userA._id });
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  assert(true, 'Test fixtures cleaned up successfully');

  console.log('\n================================================================');
  console.log(' PHASE 3 STEP 13 — NOTIFICATIONS AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`  Total Checks : ${checks}`);
  console.log(`  Passed       : ${passed}`);
  console.log(`  Failed       : ${failed}`);
  console.log('================================================================\n');

  await disconnectDatabase();
  server.close();

  if (failed > 0) {
    process.exit(1);
  }
}

runStep3mTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
