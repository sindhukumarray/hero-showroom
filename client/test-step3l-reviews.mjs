/**
 * HERO SHOWROOM — Phase 3 Step 12 Frontend Review Audit
 * Validates frontend service, component files, and API contract.
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
console.log(' HERO SHOWROOM — PHASE 3 STEP 12 REVIEWS FRONTEND AUDIT        ');
console.log('================================================================\n');

// ============================================================
// 1. Service File
// ============================================================
console.log('1. Auditing reviewService.js:');

const svcPath = path.join(CLIENT_SRC, 'services', 'reviewService.js');
assert(fileExists(svcPath), 'client/src/services/reviewService.js exists');
assert(fileContains(svcPath, 'getShowroomReviews'), 'reviewService exports getShowroomReviews');
assert(fileContains(svcPath, 'createReview'), 'reviewService exports createReview');
assert(fileContains(svcPath, 'getMyReviews'), 'reviewService exports getMyReviews');
assert(fileContains(svcPath, 'getReviewById'), 'reviewService exports getReviewById');
assert(fileContains(svcPath, 'updateReview'), 'reviewService exports updateReview');
assert(fileContains(svcPath, 'deleteReview'), 'reviewService exports deleteReview');

const svcIndex = path.join(CLIENT_SRC, 'services', 'index.js');
assert(fileContains(svcIndex, 'reviewService'), 'reviewService registered in services/index.js');

// ============================================================
// 2. Component Files
// ============================================================
console.log('\n2. Auditing Review Components:');

const ratStarsPath = path.join(CLIENT_SRC, 'components', 'reviews', 'RatingStars.jsx');
assert(fileExists(ratStarsPath), 'RatingStars.jsx exists');
assert(fileContains(ratStarsPath, 'radiogroup'), 'RatingStars uses radiogroup role for interactive mode');
assert(fileContains(ratStarsPath, 'aria-checked'), 'RatingStars has aria-checked');
assert(fileContains(ratStarsPath, 'aria-label'), 'RatingStars has aria-label');
assert(fileContains(ratStarsPath, 'usePrefersReducedMotion'), 'RatingStars respects prefers-reduced-motion');
assert(fileContains(ratStarsPath, 'readonly'), 'RatingStars has readonly display mode');

const reviewCardPath = path.join(CLIENT_SRC, 'components', 'reviews', 'ReviewCard.jsx');
assert(fileExists(reviewCardPath), 'ReviewCard.jsx exists');
assert(fileContains(reviewCardPath, 'RatingStars'), 'ReviewCard uses RatingStars');
assert(fileContains(reviewCardPath, 'displayName'), 'ReviewCard uses safe displayName');
assert(!fileContains(reviewCardPath, 'passwordHash'), 'ReviewCard does not reference passwordHash');

const reviewFormPath = path.join(CLIENT_SRC, 'components', 'reviews', 'ReviewForm.jsx');
assert(fileExists(reviewFormPath), 'ReviewForm.jsx exists');
assert(fileContains(reviewFormPath, 'isAuthenticated'), 'ReviewForm checks authentication');
assert(fileContains(reviewFormPath, 'navigate'), 'ReviewForm redirects unauthenticated users');
assert(fileContains(reviewFormPath, 'createReview'), 'ReviewForm calls createReview service');
assert(fileContains(reviewFormPath, '409'), 'ReviewForm handles duplicate 409 response');
assert(fileContains(reviewFormPath, 'submitting'), 'ReviewForm has submitting state');
assert(fileContains(reviewFormPath, 'success'), 'ReviewForm has success state');
assert(fileContains(reviewFormPath, 'pending'), 'ReviewForm informs user of pending moderation');
assert(fileContains(reviewFormPath, 'aria-label'), 'ReviewForm has aria-label');
assert(fileContains(reviewFormPath, 'noValidate'), 'ReviewForm uses noValidate for custom validation');

const reviewListPath = path.join(CLIENT_SRC, 'components', 'reviews', 'ReviewList.jsx');
assert(fileExists(reviewListPath), 'ReviewList.jsx exists');
assert(fileContains(reviewListPath, 'getShowroomReviews'), 'ReviewList fetches showroom reviews');
assert(fileContains(reviewListPath, 'aggregation'), 'ReviewList handles aggregation data');
assert(fileContains(reviewListPath, 'averageRating'), 'ReviewList displays average rating');
assert(fileContains(reviewListPath, 'distribution'), 'ReviewList displays rating distribution');
assert(fileContains(reviewListPath, 'ReviewCard'), 'ReviewList renders ReviewCards');
assert(fileContains(reviewListPath, 'ReviewForm'), 'ReviewList includes ReviewForm');
assert(fileContains(reviewListPath, 'EmptyState'), 'ReviewList handles empty state');
assert(fileContains(reviewListPath, 'Loading'), 'ReviewList handles loading state');
assert(fileContains(reviewListPath, 'hasMore') || fileContains(reviewListPath, 'Load More') || fileContains(reviewListPath, 'load more'), 'ReviewList has load more / pagination');

const reviewActivityPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'ReviewActivityList.jsx');
assert(fileExists(reviewActivityPath), 'ReviewActivityList.jsx exists');
assert(fileContains(reviewActivityPath, 'deleteReview'), 'ReviewActivityList calls deleteReview');
assert(fileContains(reviewActivityPath, 'updateReview'), 'ReviewActivityList calls updateReview');
assert(fileContains(reviewActivityPath, 'pending'), 'ReviewActivityList shows pending status');
assert(fileContains(reviewActivityPath, 'approved'), 'ReviewActivityList shows approved status');
assert(fileContains(reviewActivityPath, 'rejected'), 'ReviewActivityList shows rejected status');
assert(fileContains(reviewActivityPath, 'Edit'), 'ReviewActivityList has edit action');
assert(fileContains(reviewActivityPath, 'Delete'), 'ReviewActivityList has delete action');
assert(fileContains(reviewActivityPath, 'onRefresh'), 'ReviewActivityList accepts onRefresh callback');

// ============================================================
// 3. Components Index
// ============================================================
console.log('\n3. Components Barrel:');

const compIndex = path.join(CLIENT_SRC, 'components', 'index.js');
assert(fileContains(compIndex, 'RatingStars'), 'RatingStars exported from components/index.js');
assert(fileContains(compIndex, 'ReviewCard'), 'ReviewCard exported from components/index.js');
assert(fileContains(compIndex, 'ReviewForm'), 'ReviewForm exported from components/index.js');
assert(fileContains(compIndex, 'ReviewList'), 'ReviewList exported from components/index.js');
assert(fileContains(compIndex, 'ReviewActivityList'), 'ReviewActivityList exported from components/index.js');

// ============================================================
// 4. ShowroomDetailPage Integration
// ============================================================
console.log('\n4. ShowroomDetailPage Integration:');

const showroomDetailPath = path.join(CLIENT_SRC, 'pages', 'ShowroomDetailPage.jsx');
assert(fileContains(showroomDetailPath, 'ReviewList'), 'ShowroomDetailPage imports ReviewList');
assert(fileContains(showroomDetailPath, 'showroomId={showroom._id'), 'ShowroomDetailPage passes showroomId to ReviewList');
assert(!fileContains(showroomDetailPath, 'passwordHash'), 'ShowroomDetailPage does not reference passwordHash');

// ============================================================
// 5. DashboardPage Integration
// ============================================================
console.log('\n5. DashboardPage Integration:');

const dashboardPath = path.join(CLIENT_SRC, 'pages', 'DashboardPage.jsx');
assert(fileContains(dashboardPath, 'ReviewActivityList'), 'DashboardPage imports ReviewActivityList');
assert(fileContains(dashboardPath, 'reviewService'), 'DashboardPage imports reviewService');
assert(fileContains(dashboardPath, 'getMyReviews'), 'DashboardPage calls getMyReviews');
assert(fileContains(dashboardPath, 'reviews'), "DashboardPage has reviews state");
assert(fileContains(dashboardPath, 'My Reviews'), "DashboardPage has My Reviews tab label");
assert(fileContains(dashboardPath, "activeTab === 'reviews'"), "DashboardPage has reviews tab conditional");
assert(fileContains(dashboardPath, 'onRefresh={fetchUserActivity}'), 'DashboardPage passes onRefresh to ReviewActivityList');

// ============================================================
// 6. Security Checks
// ============================================================
console.log('\n6. Security Checks:');

const reviewFiles = [svcPath, reviewFormPath, reviewListPath, reviewCardPath, reviewActivityPath, ratStarsPath];
let noJwtSecret = true;
let noMongoUri = true;
let noPasswordHash = true;
for (const f of reviewFiles) {
  if (fileContains(f, 'JWT_SECRET')) noJwtSecret = false;
  if (fileContains(f, 'MONGODB_URI')) noMongoUri = false;
  if (fileContains(f, 'passwordHash')) noPasswordHash = false;
}
assert(noJwtSecret, 'No JWT_SECRET in frontend review files');
assert(noMongoUri, 'No MONGODB_URI in frontend review files');
assert(noPasswordHash, 'No passwordHash in frontend review files');

// ============================================================
// 7. Live API Contract Validation
// ============================================================
console.log('\n7. Live API Contract Validation:');

const dotenv = createRequire(import.meta.url)('dotenv');
const path2 = createRequire(import.meta.url)('path');
dotenv.config({ path: path2.resolve(ROOT, 'server', '.env') });

// Use dynamic import for the server app
try {
  const { connectDatabase, disconnectDatabase, isConnected } = createRequire(import.meta.url)(
    path.join(ROOT, 'server', 'src', 'config', 'database.js')
  );
  const app = createRequire(import.meta.url)(path.join(ROOT, 'server', 'src', 'app.js'));
  const { Showroom } = createRequire(import.meta.url)(path.join(ROOT, 'server', 'src', 'models', 'index.js'));

  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;

  const request = (urlPath, method = 'GET', body = null, headers = {}) =>
    new Promise((resolve, reject) => {
      const postData = body ? JSON.stringify(body) : '';
      const h = { 'Content-Type': 'application/json', ...headers };
      if (postData) h['Content-Length'] = Buffer.byteLength(postData);
      const req = http.request(`http://127.0.0.1:${port}${urlPath}`, { method, headers: h }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data }); }
        });
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });

  // Find a real active showroom
  const showroom = await Showroom.findOne({ isActive: true });
  if (showroom) {
    const reviewsRes = await request(`/api/reviews/showroom/${showroom._id}`);
    assert(reviewsRes.status === 200, 'GET /api/reviews/showroom/:id returns 200');
    assert(reviewsRes.data?.success === true, 'Showroom reviews API success=true');
    assert(Array.isArray(reviewsRes.data?.data), 'Showroom reviews data is an array');
    assert(typeof reviewsRes.data?.meta?.aggregation === 'object', 'Aggregation object present in meta');
    assert(typeof reviewsRes.data?.meta?.aggregation?.averageRating === 'number', 'averageRating is a number');
    assert(typeof reviewsRes.data?.meta?.aggregation?.totalReviews === 'number', 'totalReviews is a number');
    assert(typeof reviewsRes.data?.meta?.aggregation?.distribution === 'object', 'distribution is an object');
    assert(['1','2','3','4','5'].every(k => k in reviewsRes.data.meta.aggregation.distribution), 'distribution has keys 1-5');
  } else {
    assert(false, 'No active showroom found to test API contract');
  }

  // Unauthenticated POST rejected
  const unauthPost = await request('/api/reviews', 'POST', { rating: 4 });
  assert(unauthPost.status === 401, 'POST /api/reviews (unauthenticated) returns 401');

  // Unauthenticated GET /my rejected
  const unauthMy = await request('/api/reviews/my');
  assert(unauthMy.status === 401, 'GET /api/reviews/my (unauthenticated) returns 401');

  await new Promise((r) => server.close(r));
  await disconnectDatabase();
} catch (err) {
  console.error(`  [API contract check skipped]: ${err.message}`);
  assert(false, `Live API contract test failed: ${err.message}`);
}

// ============================================================
// Summary
// ============================================================
console.log('\n================================================================');
console.log(' PHASE 3 STEP 12 — REVIEWS FRONTEND AUDIT SUMMARY');
console.log('================================================================');
console.log(`  Total Checks : ${total}`);
console.log(`  Passed       : ${passed}`);
console.log(`  Failed       : ${failed}`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
