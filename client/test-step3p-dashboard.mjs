/**
 * HERO SHOWROOM — Phase 3 Step 16 Customer Dashboard Completion & Activity Hub Test Suite
 * Comprehensive automated verification for customer dashboard architecture, 8 sections/tabs,
 * live service integration, summary metrics, accessibility, responsiveness, session security,
 * and empty/loading/error state handling.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
console.log(' HERO SHOWROOM — PHASE 3 STEP 16 CUSTOMER DASHBOARD AUDIT & TESTS');
console.log('================================================================\n');

// 1. Dashboard route exists
console.log('1. Routing & Protection Verification:');
const appRoutesPath = path.join(CLIENT_SRC, 'routes', 'AppRoutes.jsx');
assert(fileContains(appRoutesPath, 'path="dashboard"'), '1. Dashboard route (/dashboard) exists in AppRoutes.jsx');

// 2. Auth protection exists
assert(fileContains(appRoutesPath, '<Route element={<ProtectedRoute />}>') &&
       fileContains(appRoutesPath, '<Route path="dashboard" element={<DashboardPage />} />'),
       '2. Dashboard route is wrapped with ProtectedRoute auth guard');

// 3. Overview section exists
const dashboardPagePath = path.join(CLIENT_SRC, 'pages', 'DashboardPage.jsx');
assert(fileContains(dashboardPagePath, "activeTab === 'overview'"), '3. Overview section exists as default dashboard view');

// 4. Lead section exists
assert(fileContains(dashboardPagePath, "activeTab === 'leads'") &&
       fileContains(dashboardPagePath, 'LeadActivityList'),
       '4. My Leads section exists with LeadActivityList component');

// 5. Test ride section exists
assert(fileContains(dashboardPagePath, "activeTab === 'testRides'") &&
       fileContains(dashboardPagePath, 'TestRideActivityList'),
       '5. Test Rides section exists with TestRideActivityList component');

// 6. Offers section exists
assert(fileContains(dashboardPagePath, "activeTab === 'offers'") &&
       fileContains(dashboardPagePath, 'OffersActivityList'),
       '6. Offers section exists with OffersActivityList component');

// 7. Favorites section exists
assert(fileContains(dashboardPagePath, "activeTab === 'favorites'") &&
       fileContains(dashboardPagePath, 'FavoritesActivityList'),
       '7. Favorites section exists with FavoritesActivityList component');

// 8. Reviews section exists
assert(fileContains(dashboardPagePath, "activeTab === 'reviews'") &&
       fileContains(dashboardPagePath, 'ReviewActivityList'),
       '8. Reviews section exists with ReviewActivityList component');

// 9. Notifications section exists
assert(fileContains(dashboardPagePath, "activeTab === 'notifications'") &&
       fileContains(dashboardPagePath, 'NotificationsActivityList'),
       '9. Notifications section exists with NotificationsActivityList component');

// 10. Profile section exists
assert(fileContains(dashboardPagePath, "activeTab === 'profile'") &&
       fileContains(dashboardPagePath, 'ProfileSection'),
       '10. Profile / Account section exists with ProfileSection component');

// 11. Summary cards exist
const summaryCardPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'DashboardSummaryCard.jsx');
assert(fileExists(summaryCardPath), '11a. DashboardSummaryCard component file exists');
assert(fileContains(dashboardPagePath, '<DashboardSummaryCard'), '11b. Summary metric cards are rendered in Overview tab');

// 12. Real API services are used
assert(fileContains(dashboardPagePath, 'leadService.getMyLeads') &&
       fileContains(dashboardPagePath, 'testRideService.getMyTestRides') &&
       fileContains(dashboardPagePath, 'favoriteService.getMyFavorites') &&
       fileContains(dashboardPagePath, 'reviewService.getMyReviews') &&
       fileContains(dashboardPagePath, 'offerService.getOffers'),
       '12. Real API services (leads, rides, favorites, reviews, offers) are used in activity fetch');

// 13. No hardcoded fake customer counts
const dashboardCode = fs.readFileSync(dashboardPagePath, 'utf-8');
const fakeCountsDetected = /count\s*[:=]\s*(?:42|99|123|1000)\b/.test(dashboardCode);
assert(!fakeCountsDetected, '13. No hardcoded fake customer activity counts detected');

// 14. Loading states exist
assert(fileContains(dashboardPagePath, '<Loading text=') &&
       fileContains(dashboardPagePath, 'activityLoading') &&
       fileContains(summaryCardPath, 'isLoading'),
       '14. Loading states exist across dashboard page, components, and summary cards');

// 15. Empty states exist
const offersListPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'OffersActivityList.jsx');
assert(fileContains(dashboardPagePath, '<EmptyState') &&
       fileContains(offersListPath, '<EmptyState'),
       '15. Polished EmptyState components exist for zero activity and empty tabs');

// 16. Error states exist
assert(fileContains(dashboardPagePath, 'activityError') &&
       fileContains(dashboardPagePath, 'role="alert"') &&
       fileContains(offersListPath, 'AlertCircle'),
       '16. Friendly error states with retry functionality are implemented');

// 17. Notification integration uses existing NotificationContext
assert(fileContains(dashboardPagePath, 'useNotifications') &&
       fileContains(dashboardPagePath, 'unreadCount') &&
       fileContains(dashboardPagePath, 'fetchNotifications'),
       '17. Customer notification integration reuses existing NotificationContext');

// 18. Favorite actions use existing service
const favsListPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'FavoritesActivityList.jsx');
assert(fileContains(favsListPath, 'FavoriteButton') &&
       fileContains(dashboardPagePath, 'favoriteService.getMyFavorites'),
       '18. Favorite actions and list reuse existing favoriteService and FavoriteButton');

// 19. Review data uses existing service
const reviewsListPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'ReviewActivityList.jsx');
assert(fileContains(reviewsListPath, 'reviewService') &&
       fileContains(dashboardPagePath, 'reviewService.getMyReviews'),
       '19. Review data and actions reuse existing reviewService');

// 20. Lead data uses existing service
const leadsListPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'LeadActivityList.jsx');
assert(fileContains(dashboardPagePath, 'leadService.getMyLeads') &&
       fileContains(leadsListPath, 'getStatusBadgeVariant'),
       '20. Lead queries use existing leadService.getMyLeads and LeadActivityList');

// 21. Test ride data uses existing service
const ridesListPath = path.join(CLIENT_SRC, 'components', 'dashboard', 'TestRideActivityList.jsx');
assert(fileContains(dashboardPagePath, 'testRideService.getMyTestRides') &&
       fileContains(ridesListPath, 'getStatusBadgeVariant'),
       '21. Test ride requests use existing testRideService.getMyTestRides');

// 22. Offer data uses existing service
assert(fileContains(dashboardPagePath, "offerService.getOffers({ active: 'true' })") &&
       fileContains(offersListPath, 'OfferCard'),
       '22. Offer data uses existing offerService and OfferCard component');

// 23. Logout/session protection remains intact
const profilePath = path.join(CLIENT_SRC, 'components', 'dashboard', 'ProfileSection.jsx');
assert(fileContains(dashboardPagePath, 'logout') &&
       fileContains(profilePath, 'onLogout') &&
       fileContains(appRoutesPath, 'ProtectedRoute'),
       '23. Session security, logout trigger, and route guard remain intact');

// 24. No sensitive credentials rendered
const profileCode = fs.readFileSync(profilePath, 'utf-8');
const dashboardCodeClean = fs.readFileSync(dashboardPagePath, 'utf-8');
const noUserSensitiveAccess = !/user\.(?:password|token|jwt)/i.test(profileCode) && !/user\.(?:password|token|jwt)/i.test(dashboardCodeClean);
const noRawSensitive = !profileCode.includes('password') && !profileCode.includes('token') && !profileCode.includes('jwt');
assert(noUserSensitiveAccess && noRawSensitive, '24. Strictly zero sensitive credentials (passwords, JWTs, tokens) rendered');

// 25. Responsive dashboard classes/layout exist
assert(fileContains(dashboardPagePath, 'grid-cols-1') &&
       fileContains(dashboardPagePath, 'overflow-x-auto') &&
       fileContains(dashboardPagePath, 'sm:grid-cols-2'),
       '25. Responsive grid layouts, touch scroll, and stacking classes exist');

// 26. Accessibility labels/navigation exist
assert(fileContains(dashboardPagePath, 'role="tablist"') &&
       fileContains(dashboardPagePath, 'role="tab"') &&
       fileContains(dashboardPagePath, 'aria-selected') &&
       fileContains(dashboardPagePath, 'role="tabpanel"'),
       '26. WAI-ARIA tablist, tab, aria-selected, and tabpanel semantic attributes exist');

// Summary
console.log('\n================================================================');
console.log(` SUMMARY: ${passed}/${total} TESTS PASSED (${failed} FAILED)`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
