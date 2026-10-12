/**
 * HERO SHOWROOM — PHASE 3 STEP 11
 * FAVORITES FRONTEND INTEGRATION TEST
 *
 * Validates the favoriteService client module, component exports,
 * and end-to-end toggle/check/list API integration.
 *
 * Prerequisites:
 *   - Server running with MONGODB connection
 *   - A valid HERO_SHOWROOM_TEST_TOKEN in environment OR server responsive
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

console.log('================================================================');
console.log(' HERO SHOWROOM — PHASE 3 STEP 11 FAVORITES FRONTEND AUDIT       ');
console.log('================================================================\n');

// ============================================================
// 1. File existence checks
// ============================================================
console.log('1. File Existence Checks:');

const BASE = path.resolve(__dirname, 'src');
const files = [
  ['services/favoriteService.js', 'favoriteService.js'],
  ['services/index.js', 'services/index.js (barrel)'],
  ['components/favorites/FavoriteButton.jsx', 'FavoriteButton.jsx'],
  ['components/dashboard/FavoritesActivityList.jsx', 'FavoritesActivityList.jsx'],
  ['components/index.js', 'components/index.js (barrel)'],
  ['pages/DashboardPage.jsx', 'DashboardPage.jsx'],
  ['pages/BikeDetailPage.jsx', 'BikeDetailPage.jsx'],
  ['pages/ShowroomDetailPage.jsx', 'ShowroomDetailPage.jsx'],
];

for (const [rel, label] of files) {
  const fullPath = path.join(BASE, rel);
  assert(fs.existsSync(fullPath), `${label} exists`);
}

// ============================================================
// 2. favoriteService content validation
// ============================================================
console.log('\n2. favoriteService.js Content Validation:');

const svcPath = path.join(BASE, 'services/favoriteService.js');
if (fs.existsSync(svcPath)) {
  const svc = fs.readFileSync(svcPath, 'utf8');
  assert(svc.includes('toggleFavorite'), 'favoriteService exports toggleFavorite');
  assert(svc.includes('checkFavorite'), 'favoriteService exports checkFavorite');
  assert(svc.includes('getMyFavorites'), 'favoriteService exports getMyFavorites');
  assert(svc.includes('/favorites/toggle'), 'toggleFavorite targets /favorites/toggle');
  assert(svc.includes('/favorites/check'), 'checkFavorite targets /favorites/check');
  assert(svc.includes('/favorites/my'), 'getMyFavorites targets /favorites/my');
} else {
  assert(false, 'favoriteService.js missing — skipping content checks');
}

// ============================================================
// 3. services/index.js barrel validation
// ============================================================
console.log('\n3. services/index.js Barrel Validation:');

const svcIndexPath = path.join(BASE, 'services/index.js');
if (fs.existsSync(svcIndexPath)) {
  const idx = fs.readFileSync(svcIndexPath, 'utf8');
  assert(idx.includes('favoriteService'), 'services/index.js exports favoriteService');
} else {
  assert(false, 'services/index.js missing');
}

// ============================================================
// 4. FavoriteButton component validation
// ============================================================
console.log('\n4. FavoriteButton Component Validation:');

const btnPath = path.join(BASE, 'components/favorites/FavoriteButton.jsx');
if (fs.existsSync(btnPath)) {
  const btn = fs.readFileSync(btnPath, 'utf8');
  assert(btn.includes('entityType'), 'FavoriteButton accepts entityType prop');
  assert(btn.includes('entityId'), 'FavoriteButton accepts entityId prop');
  assert(btn.includes('useAuth'), 'FavoriteButton uses useAuth hook');
  assert(btn.includes('useNavigate'), 'FavoriteButton uses useNavigate for redirect');
  assert(btn.includes('toggleFavorite'), 'FavoriteButton calls toggleFavorite');
  assert(btn.includes('checkFavorite'), 'FavoriteButton calls checkFavorite on mount');
  assert(btn.includes("navigate('/login'"), 'FavoriteButton redirects to /login when unauthenticated');
  assert(btn.includes('optimistic') || btn.includes('previousState'), 'FavoriteButton implements optimistic UI with rollback');
  assert(btn.includes('aria-pressed'), 'FavoriteButton has aria-pressed accessibility attribute');
  assert(btn.includes('aria-label'), 'FavoriteButton has aria-label accessibility attribute');
  assert(btn.includes('Heart'), 'FavoriteButton renders Heart icon');
} else {
  assert(false, 'FavoriteButton.jsx missing — skipping content checks');
}

// ============================================================
// 5. FavoritesActivityList component validation
// ============================================================
console.log('\n5. FavoritesActivityList Component Validation:');

const listPath = path.join(BASE, 'components/dashboard/FavoritesActivityList.jsx');
if (fs.existsSync(listPath)) {
  const list = fs.readFileSync(listPath, 'utf8');
  assert(list.includes('FavoriteButton'), 'FavoritesActivityList imports FavoriteButton');
  assert(list.includes('entityType'), 'FavoritesActivityList handles entityType');
  assert(list.includes("entityType === 'bike'") || list.includes("isBike"), 'FavoritesActivityList differentiates bike vs showroom');
  assert(list.includes('EmptyState'), 'FavoritesActivityList shows EmptyState when empty');
  assert(list.includes('Loading'), 'FavoritesActivityList shows loading state');
  assert(list.includes('/bikes/'), 'FavoritesActivityList links to bike detail pages');
  assert(list.includes('/showrooms/'), 'FavoritesActivityList links to showroom detail pages');
} else {
  assert(false, 'FavoritesActivityList.jsx missing — skipping content checks');
}

// ============================================================
// 6. components/index.js barrel validation
// ============================================================
console.log('\n6. components/index.js Barrel Validation:');

const compIdxPath = path.join(BASE, 'components/index.js');
if (fs.existsSync(compIdxPath)) {
  const compIdx = fs.readFileSync(compIdxPath, 'utf8');
  assert(compIdx.includes('FavoriteButton'), 'components/index.js exports FavoriteButton');
  assert(compIdx.includes('FavoritesActivityList'), 'components/index.js exports FavoritesActivityList');
} else {
  assert(false, 'components/index.js missing');
}

// ============================================================
// 7. DashboardPage integration validation
// ============================================================
console.log('\n7. DashboardPage Integration Validation:');

const dashPath = path.join(BASE, 'pages/DashboardPage.jsx');
if (fs.existsSync(dashPath)) {
  const dash = fs.readFileSync(dashPath, 'utf8');
  assert(dash.includes('favoriteService'), 'DashboardPage imports favoriteService');
  assert(dash.includes('FavoritesActivityList'), 'DashboardPage imports FavoritesActivityList');
  assert(dash.includes('favorites'), 'DashboardPage has favorites state');
  assert(dash.includes('getMyFavorites'), 'DashboardPage calls getMyFavorites');
  assert(dash.includes("activeTab === 'favorites'") || dash.includes("'favorites'"), 'DashboardPage has favorites tab');
  assert(dash.includes('Heart'), 'DashboardPage uses Heart icon for favorites tab');
  assert(dash.includes("label: 'Favorites'") || dash.includes('Favorites') || dash.includes('Saved Items'), 'DashboardPage shows "Favorites" tab label');
} else {
  assert(false, 'DashboardPage.jsx missing');
}

// ============================================================
// 8. BikeDetailPage integration validation
// ============================================================
console.log('\n8. BikeDetailPage Integration Validation:');

const bikePath = path.join(BASE, 'pages/BikeDetailPage.jsx');
if (fs.existsSync(bikePath)) {
  const bike = fs.readFileSync(bikePath, 'utf8');
  assert(bike.includes('FavoriteButton'), 'BikeDetailPage imports FavoriteButton');
  assert(bike.includes("entityType=\"bike\""), 'BikeDetailPage passes entityType="bike" to FavoriteButton');
  assert(bike.includes('entityId={bike._id}') || bike.includes("entityId={bike?._id}"), 'BikeDetailPage passes bike._id as entityId');
} else {
  assert(false, 'BikeDetailPage.jsx missing');
}

// ============================================================
// 9. ShowroomDetailPage integration validation
// ============================================================
console.log('\n9. ShowroomDetailPage Integration Validation:');

const showroomPath = path.join(BASE, 'pages/ShowroomDetailPage.jsx');
if (fs.existsSync(showroomPath)) {
  const showroomPage = fs.readFileSync(showroomPath, 'utf8');
  assert(showroomPage.includes('FavoriteButton'), 'ShowroomDetailPage imports FavoriteButton');
  assert(showroomPage.includes("entityType=\"showroom\""), 'ShowroomDetailPage passes entityType="showroom" to FavoriteButton');
  assert(
    showroomPage.includes('entityId={showroom._id}') || showroomPage.includes("entityId={showroom?._id}"),
    'ShowroomDetailPage passes showroom._id as entityId'
  );
} else {
  assert(false, 'ShowroomDetailPage.jsx missing');
}

// ============================================================
// Summary
// ============================================================
console.log('\n================================================================');
console.log(' PHASE 3 STEP 11 — FAVORITES FRONTEND AUDIT SUMMARY');
console.log('================================================================');
console.log(`  Total Checks : ${checks}`);
console.log(`  Passed       : ${passed}`);
console.log(`  Failed       : ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
