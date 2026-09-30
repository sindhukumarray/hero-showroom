/**
 * HERO SHOWROOM — Phase 3 Step 13 Frontend Notifications Audit
 * Validates frontend service, context, notification components, header & dashboard integration, and live API contract.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLIENT_SRC = path.join(__dirname, 'src');

let passed = 0;
let failed = 0;
let total = 0;

const assert = (condition, description) => {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    failed++;
  }
};

const fileExists = (...parts) => fs.existsSync(path.join(...parts));
const fileContains = (filePath, str) => {
  try {
    return fs.readFileSync(filePath, 'utf-8').includes(str);
  } catch {
    return false;
  }
};

console.log('================================================================');
console.log(' HERO SHOWROOM — PHASE 3 STEP 13 NOTIFICATIONS FRONTEND AUDIT  ');
console.log('================================================================\n');

// ============================================================
// 1. Notification Service File
// ============================================================
console.log('1. Auditing notificationService.js:');

const svcPath = path.join(CLIENT_SRC, 'services', 'notificationService.js');
assert(fileExists(svcPath), 'client/src/services/notificationService.js exists');
assert(fileContains(svcPath, 'getNotifications'), 'notificationService exports getNotifications');
assert(fileContains(svcPath, 'getUnreadCount'), 'notificationService exports getUnreadCount');
assert(fileContains(svcPath, 'markAsRead'), 'notificationService exports markAsRead');
assert(fileContains(svcPath, 'markAllAsRead'), 'notificationService exports markAllAsRead');
assert(fileContains(svcPath, 'deleteNotification'), 'notificationService exports deleteNotification');

const svcIndex = path.join(CLIENT_SRC, 'services', 'index.js');
assert(fileContains(svcIndex, 'notificationService'), 'notificationService registered in services/index.js');

// ============================================================
// 2. Notification Context & Provider
// ============================================================
console.log('\n2. Auditing NotificationContext.jsx:');

const contextPath = path.join(CLIENT_SRC, 'context', 'NotificationContext.jsx');
assert(fileExists(contextPath), 'client/src/context/NotificationContext.jsx exists');
assert(fileContains(contextPath, 'NotificationProvider'), 'NotificationContext exports NotificationProvider');
assert(fileContains(contextPath, 'useNotifications'), 'NotificationContext exports useNotifications hook');
assert(fileContains(contextPath, 'unreadCount'), 'NotificationContext manages unreadCount state');
assert(fileContains(contextPath, 'markAsRead'), 'NotificationContext provides markAsRead handler');
assert(fileContains(contextPath, 'markAllAsRead'), 'NotificationContext provides markAllAsRead handler');
assert(fileContains(contextPath, 'deleteNotification'), 'NotificationContext provides deleteNotification handler');

const appPath = path.join(CLIENT_SRC, 'App.jsx');
assert(fileContains(appPath, 'NotificationProvider'), 'App.jsx wraps routes in NotificationProvider');

// ============================================================
// 3. Notification Components
// ============================================================
console.log('\n3. Auditing Notification Components:');

const bellPath = path.join(CLIENT_SRC, 'components', 'notifications', 'NotificationBell.jsx');
assert(fileExists(bellPath), 'NotificationBell.jsx exists');
assert(fileContains(bellPath, 'useNotifications'), 'NotificationBell consumes useNotifications hook');
assert(fileContains(bellPath, 'useAuth'), 'NotificationBell checks authentication state');
assert(fileContains(bellPath, 'unreadCount'), 'NotificationBell renders unread counter');
assert(fileContains(bellPath, 'aria-haspopup'), 'NotificationBell defines aria-haspopup');
assert(fileContains(bellPath, 'aria-expanded'), 'NotificationBell manages aria-expanded state');
assert(fileContains(bellPath, 'Escape'), 'NotificationBell supports Escape key dismissal');

const panelPath = path.join(CLIENT_SRC, 'components', 'notifications', 'NotificationPanel.jsx');
assert(fileExists(panelPath), 'NotificationPanel.jsx exists');
assert(fileContains(panelPath, 'NotificationList'), 'NotificationPanel embeds NotificationList');
assert(fileContains(panelPath, 'to="/dashboard"'), 'NotificationPanel links directly to dashboard');

const listPath = path.join(CLIENT_SRC, 'components', 'notifications', 'NotificationList.jsx');
assert(fileExists(listPath), 'NotificationList.jsx exists');
assert(fileContains(listPath, 'NotificationItem'), 'NotificationList maps NotificationItem elements');
assert(fileContains(listPath, 'Loading'), 'NotificationList handles loading state');
assert(fileContains(listPath, 'EmptyState'), 'NotificationList handles empty state');
assert(fileContains(listPath, 'filterMode'), 'NotificationList supports unread/all filter tabs');
assert(fileContains(listPath, 'onMarkAllAsRead'), 'NotificationList provides bulk mark all as read action');

const itemPath = path.join(CLIENT_SRC, 'components', 'notifications', 'NotificationItem.jsx');
assert(fileExists(itemPath), 'NotificationItem.jsx exists');
assert(fileContains(itemPath, '!isRead'), 'NotificationItem provides distinct unread visual styling');
assert(fileContains(itemPath, 'formatTimeAgo'), 'NotificationItem formats relative timestamps');
assert(fileContains(itemPath, 'onMarkAsRead'), 'NotificationItem provides mark-read action');
assert(fileContains(itemPath, 'onDelete'), 'NotificationItem provides delete action');

const notifActivityPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'NotificationsActivityList.jsx');
assert(fileExists(notifActivityPath), 'NotificationsActivityList.jsx exists');
assert(fileContains(notifActivityPath, 'useNotifications'), 'NotificationsActivityList consumes useNotifications hook');

// Components Barrel
const compIndex = path.join(CLIENT_SRC, 'components', 'index.js');
assert(fileContains(compIndex, 'NotificationBell'), 'NotificationBell exported from components/index.js');
assert(fileContains(compIndex, 'NotificationPanel'), 'NotificationPanel exported from components/index.js');
assert(fileContains(compIndex, 'NotificationList'), 'NotificationList exported from components/index.js');
assert(fileContains(compIndex, 'NotificationItem'), 'NotificationItem exported from components/index.js');
assert(fileContains(compIndex, 'NotificationsActivityList'), 'NotificationsActivityList exported from components/index.js');

// ============================================================
// 4. Header & Dashboard Integration
// ============================================================
console.log('\n4. Auditing Navigation & Dashboard Integration:');

const headerPath = path.join(CLIENT_SRC, 'components', 'Header.jsx');
assert(fileContains(headerPath, 'NotificationBell'), 'Header.jsx embeds NotificationBell for authenticated users');

const dashboardPath = path.join(CLIENT_SRC, 'pages', 'DashboardPage.jsx');
assert(fileContains(dashboardPath, 'NotificationsActivityList'), 'DashboardPage imports NotificationsActivityList');
assert(fileContains(dashboardPath, 'useNotifications'), 'DashboardPage consumes useNotifications');
assert(fileContains(dashboardPath, 'activeTab === \'notifications\''), 'DashboardPage has notifications tab conditional');
assert(fileContains(dashboardPath, 'Bell'), 'DashboardPage displays notification bell tab icon');

// ============================================================
// 5. Security & Hygiene Checks
// ============================================================
console.log('\n5. Auditing Security & Hygiene:');

const notifFiles = [svcPath, contextPath, bellPath, panelPath, listPath, itemPath, notifActivityPath];
let noJwtSecret = true;
let noMongoUri = true;
let noPasswordHash = true;

for (const f of notifFiles) {
  if (fileContains(f, 'JWT_SECRET')) noJwtSecret = false;
  if (fileContains(f, 'MONGODB_URI')) noMongoUri = false;
  if (fileContains(f, 'passwordHash')) noPasswordHash = false;
}

assert(noJwtSecret, 'No JWT_SECRET in frontend notification files');
assert(noMongoUri, 'No MONGODB_URI in frontend notification files');
assert(noPasswordHash, 'No passwordHash in frontend notification files');

// ============================================================
// 6. Live API Contract Validation
// ============================================================
console.log('\n6. Validating Live API Response Contract:');

const serverRequire = createRequire(path.join(ROOT, 'server', 'package.json'));
const dotenv = serverRequire('dotenv');
dotenv.config({ path: path.resolve(ROOT, 'server', '.env') });

const app = serverRequire('./src/app.js');
const { connectDatabase, disconnectDatabase, isConnected } = serverRequire('./src/config/database.js');
const { User, Notification } = serverRequire('./src/models/index.js');
const authConfig = serverRequire('./src/config/auth.js');
const jwt = serverRequire('jsonwebtoken');

try {
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const testUser = await User.create({
    name: 'Frontend Notif Tester',
    email: `fe_notif_${Date.now()}@example.com`,
    passwordHash: 'hash',
    role: 'customer',
    isActive: true
  });
  const secret = authConfig.getJwtSecret();
  const token = jwt.sign({ sub: testUser._id.toString(), role: testUser.role }, secret, { expiresIn: '1h' });

  // Create 2 test notifications
  await Notification.create([
    {
      user: testUser._id,
      type: 'LEAD',
      title: 'Dealership Enquiry Submitted',
      message: 'Your enquiry for Hero Splendor Plus has been received.',
      isRead: false
    },
    {
      user: testUser._id,
      type: 'TEST_RIDE',
      title: 'Test Ride Scheduled',
      message: 'Your test ride is scheduled for tomorrow.',
      isRead: true
    }
  ]);

  const makeReq = (url, method = 'GET', extraHeaders = {}) =>
    new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json', ...extraHeaders };
      const req = http.request(`http://127.0.0.1:${port}${url}`, { method, headers }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });

  // Verify GET /api/notifications
  const listRes = await makeReq('/api/notifications', 'GET', { Authorization: `Bearer ${token}` });
  assert(listRes.status === 200, 'GET /api/notifications returns 200');
  assert(listRes.data.success === true, 'List response has success=true');
  assert(Array.isArray(listRes.data.data), 'List response data is an array');
  assert(listRes.data.data.length === 2, 'List response contains 2 notifications');
  assert(Boolean(listRes.data.meta), 'List response contains meta object');
  assert(listRes.data.meta.total === 2, 'Meta total is 2');
  assert(listRes.data.meta.unreadCount === 1, 'Meta unreadCount is 1');

  // Verify GET /api/notifications/unread-count
  const unreadRes = await makeReq('/api/notifications/unread-count', 'GET', { Authorization: `Bearer ${token}` });
  assert(unreadRes.status === 200, 'GET /api/notifications/unread-count returns 200');
  assert(unreadRes.data.data.unreadCount === 1, 'Unread count API returns exactly 1');

  // Verify PATCH /api/notifications/read-all
  const readAllRes = await makeReq('/api/notifications/read-all', 'PATCH', { Authorization: `Bearer ${token}` });
  assert(readAllRes.status === 200, 'PATCH /api/notifications/read-all returns 200');
  assert(readAllRes.data.success === true, 'Read all returns success=true');

  // Cleanup
  await Notification.deleteMany({ user: testUser._id });
  await User.deleteOne({ _id: testUser._id });
  server.close();
  await disconnectDatabase();
} catch (err) {
  assert(false, `Live API validation failed: ${err.message}`);
}

console.log('\n================================================================');
console.log(` SUMMARY: ${passed}/${total} checks passed (${failed} failed)`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
