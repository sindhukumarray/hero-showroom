/**
 * Step 13 Manual Flow Verification Script
 * Validates the complete 12-step flow specified in section 13:
 * 1. Register/login as customer.
 * 2. Create a lead.
 * 3. Verify notification is created.
 * 4. Open notification UI.
 * 5. Verify unread count.
 * 6. Mark notification as read.
 * 7. Verify unread count decreases.
 * 8. Mark all as read.
 * 9. Verify all notifications become read.
 * 10. Refresh page / restore session.
 * 11. Verify notification state persists.
 * 12. Verify another customer cannot access these notifications.
 */
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRequire = createRequire(path.join(__dirname, 'server', 'package.json'));

const dotenv = serverRequire('dotenv');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const app = serverRequire('./src/app.js');
const { connectDatabase, disconnectDatabase, isConnected } = serverRequire('./src/config/database.js');
const { User, Showroom, Bike, Lead, Notification } = serverRequire('./src/models/index.js');

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

async function runVerification() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — STEP 13 END-TO-END FLOW VERIFICATION           ');
  console.log('================================================================\n');

  await connectDatabase();
  assert(isConnected(), 'Database connected');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Live test server listening on http://127.0.0.1:${port}\n`);

  const request = (pathUrl, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const postData = body ? JSON.stringify(body) : '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

      const req = http.request(`http://127.0.0.1:${port}${pathUrl}`, { method, headers }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  const suffix = Date.now();
  let token1, user1;
  let token2, user2;

  // Step 1: Register/login as customer
  console.log('Step 1: Register / Login as Customer 1');
  const reg1Res = await request('/api/auth/register', 'POST', {
    name: 'Customer One',
    email: `customer_1_${suffix}@example.com`,
    password: 'Password@123',
    phone: '9876543210'
  });
  assert(reg1Res.status === 201, 'Customer 1 registered successfully (201)');

  const login1Res = await request('/api/auth/login', 'POST', {
    email: `customer_1_${suffix}@example.com`,
    password: 'Password@123'
  });
  assert(login1Res.status === 200, 'Customer 1 logged in successfully (200)');
  token1 = login1Res.body.data.accessToken;
  user1 = login1Res.body.data.user;
  assert(Boolean(token1 && user1), 'Customer 1 JWT received');

  // Customer 2 for isolation testing
  const reg2Res = await request('/api/auth/register', 'POST', {
    name: 'Customer Two',
    email: `customer_2_${suffix}@example.com`,
    password: 'Password@123',
    phone: '9876543211'
  });
  assert(reg2Res.status === 201, 'Customer 2 registered successfully (201)');

  const login2Res = await request('/api/auth/login', 'POST', {
    email: `customer_2_${suffix}@example.com`,
    password: 'Password@123'
  });
  assert(login2Res.status === 200, 'Customer 2 logged in successfully (200)');
  token2 = login2Res.body.data.accessToken;
  user2 = login2Res.body.data.user;
  assert(Boolean(token2 && user2), 'Customer 2 JWT received');

  // Find a showroom and bike
  const showroom = await Showroom.findOne({ isActive: true });
  const bike = await Bike.findOne({ isActive: true });
  assert(Boolean(showroom && bike), `Target showroom "${showroom?.name}" and bike "${bike?.name}" loaded`);

  // Step 2: Create a lead
  console.log('\nStep 2: Create a Lead Enquiry');
  const leadRes = await request(
    '/api/leads',
    'POST',
    {
      name: user1.name,
      email: user1.email,
      phone: user1.phone,
      showroom: showroom._id.toString(),
      bike: bike._id.toString(),
      message: 'Need on-road price breakdown and delivery timeline.'
    },
    token1
  );
  assert(leadRes.status === 201, 'Lead enquiry created with 201 status');
  const createdLeadId = leadRes.body.data.lead._id;
  assert(Boolean(createdLeadId), 'Lead document ID exists');

  // Step 3: Verify notification is created
  console.log('\nStep 3: Verify Notification Created');
  const notifListRes = await request('/api/notifications', 'GET', null, token1);
  assert(notifListRes.status === 200, 'GET /api/notifications returns 200');
  assert(notifListRes.body.data.length === 1, 'Exactly 1 notification found for Customer 1');
  const leadNotif = notifListRes.body.data[0];
  assert(leadNotif.type === 'LEAD', 'Notification type is LEAD');
  assert(leadNotif.isRead === false, 'Notification isRead is false');
  assert(leadNotif.relatedEntity === createdLeadId, 'Notification references created lead ID');

  // Step 4: Open notification UI (simulate reading details)
  console.log('\nStep 4: Open Notification UI');
  assert(leadNotif.title.includes('Enquiry'), 'Notification title is displayed accurately');
  assert(leadNotif.message.includes(bike.name), 'Notification message references selected motorcycle');

  // Step 5: Verify unread count
  console.log('\nStep 5: Verify Unread Count');
  const unreadRes1 = await request('/api/notifications/unread-count', 'GET', null, token1);
  assert(unreadRes1.status === 200, 'GET /api/notifications/unread-count returns 200');
  assert(unreadRes1.body.data.unreadCount === 1, 'Unread count is 1');

  // Create a second notification (a test ride) so we can test mark one vs mark all
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const rideRes = await request(
    '/api/test-rides',
    'POST',
    {
      name: user1.name,
      email: user1.email,
      phone: user1.phone,
      showroom: showroom._id.toString(),
      bike: bike._id.toString(),
      preferredDate: futureDate.toISOString().split('T')[0],
      preferredTime: '14:30',
      notes: 'Weekend slot'
    },
    token1
  );
  assert(rideRes.status === 201, 'Test ride booking created with 201 status');

  const unreadRes2 = await request('/api/notifications/unread-count', 'GET', null, token1);
  assert(unreadRes2.body.data.unreadCount === 2, 'Unread count is now 2');

  const listAfterRide = await request('/api/notifications', 'GET', null, token1);
  assert(listAfterRide.body.data.length === 2, 'Customer 1 has 2 notifications in list');
  const rideNotif = listAfterRide.body.data[0]; // Newest first

  // Step 6: Mark single notification as read
  console.log('\nStep 6: Mark Single Notification as Read');
  const markReadRes = await request(`/api/notifications/${rideNotif._id}/read`, 'PATCH', null, token1);
  assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returns 200');
  assert(markReadRes.body.data.isRead === true, 'Marked notification has isRead=true');

  // Step 7: Verify unread count decreases
  console.log('\nStep 7: Verify Unread Count Decreases');
  const unreadRes3 = await request('/api/notifications/unread-count', 'GET', null, token1);
  assert(unreadRes3.body.data.unreadCount === 1, 'Unread count decreased from 2 to 1');

  // Step 8: Mark all as read
  console.log('\nStep 8: Mark All Notifications as Read');
  const markAllRes = await request('/api/notifications/read-all', 'PATCH', null, token1);
  assert(markAllRes.status === 200, 'PATCH /api/notifications/read-all returns 200');
  assert(markAllRes.body.success === true, 'Mark all response has success=true');

  // Step 9: Verify all notifications become read
  console.log('\nStep 9: Verify All Notifications Become Read');
  const listAllRead = await request('/api/notifications', 'GET', null, token1);
  const allRead = listAllRead.body.data.every((n) => n.isRead === true);
  assert(allRead, 'All notifications have isRead=true');
  const unreadRes4 = await request('/api/notifications/unread-count', 'GET', null, token1);
  assert(unreadRes4.body.data.unreadCount === 0, 'Unread count is now 0');

  // Step 10: Refresh page (simulate session reload)
  console.log('\nStep 10 & 11: Refresh Page & Verify State Persists');
  // Re-fetch using token1 (as browser does on reload)
  const sessionRes = await request('/api/auth/me', 'GET', null, token1);
  assert(sessionRes.status === 200, 'Session restored successfully via GET /api/auth/me');

  const reloadedNotifs = await request('/api/notifications', 'GET', null, token1);
  assert(reloadedNotifs.status === 200, 'Notifications retrieved on page refresh');
  assert(reloadedNotifs.body.data.length === 2, 'All 2 notifications persist after page refresh');
  assert(reloadedNotifs.body.data.every((n) => n.isRead === true), 'Read state persists across page reload');

  // Step 12: Verify another customer cannot access these notifications
  console.log('\nStep 12: Verify Another Customer Cannot Access Notifications');
  const customer2List = await request('/api/notifications', 'GET', null, token2);
  assert(customer2List.status === 200, 'Customer 2 list request returns 200');
  assert(customer2List.body.data.length === 0, 'Customer 2 sees 0 notifications (no leakage of Customer 1 items)');

  const customer2Unread = await request('/api/notifications/unread-count', 'GET', null, token2);
  assert(customer2Unread.body.data.unreadCount === 0, 'Customer 2 unread count is 0');

  // Customer 2 attempts to mark Customer 1's notification as read
  const crossUserRead = await request(`/api/notifications/${leadNotif._id}/read`, 'PATCH', null, token2);
  assert(crossUserRead.status === 403, 'Customer 2 cannot mark Customer 1 notification as read (403)');

  // Customer 2 attempts to delete Customer 1's notification
  const crossUserDelete = await request(`/api/notifications/${leadNotif._id}`, 'DELETE', null, token2);
  assert(crossUserDelete.status === 403, 'Customer 2 cannot delete Customer 1 notification (403)');

  // Cleanup
  console.log('\nCleaning up verification records...');
  await Notification.deleteMany({ user: { $in: [user1._id, user2._id] } });
  await Lead.deleteMany({ user: user1._id });
  await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
  server.close();
  await disconnectDatabase();

  console.log('\n================================================================');
  console.log(` MANUAL VERIFICATION SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error('Manual verification failed:', err);
  process.exit(1);
});
