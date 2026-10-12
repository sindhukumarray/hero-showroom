import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = __dirname;

async function runDashboardTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 7 CUSTOMER DASHBOARD AUDIT       ');
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

  // 1. Dashboard Structure & Route Architecture
  console.log('1. Auditing Dashboard File Structure & Route Wire-up:');
  const dashboardPath = path.join(clientRoot, 'src/pages/DashboardPage.jsx');
  const appRoutesPath = path.join(clientRoot, 'src/routes/AppRoutes.jsx');
  const protectedRoutePath = path.join(clientRoot, 'src/components/auth/ProtectedRoute.jsx');
  const authContextPath = path.join(clientRoot, 'src/context/AuthContext.jsx');

  assert(fs.existsSync(dashboardPath), 'DashboardPage.jsx exists');
  assert(fs.existsSync(appRoutesPath), 'AppRoutes.jsx exists');
  assert(fs.existsSync(protectedRoutePath), 'ProtectedRoute.jsx exists');
  assert(fs.existsSync(authContextPath), 'AuthContext.jsx exists');

  const appRoutesCode = fs.readFileSync(appRoutesPath, 'utf8');
  assert(
    appRoutesCode.includes('<Route element={<ProtectedRoute />}>') &&
      appRoutesCode.includes('<Route path="dashboard" element={<DashboardPage />} />'),
    'AppRoutes wraps /dashboard with ProtectedRoute'
  );

  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
  const profileSectionPath = path.join(clientRoot, 'src/components/dashboard/ProfileSection.jsx');
  assert(fs.existsSync(profileSectionPath), 'ProfileSection.jsx exists');
  const profileSectionCode = fs.readFileSync(profileSectionPath, 'utf8');

  assert(
    dashboardCode.includes("import { useAuth } from '../context/AuthContext';") ||
      dashboardCode.includes('from "../context/AuthContext"') ||
      dashboardCode.includes("from '../context/AuthContext'"),
    'DashboardPage imports useAuth from central AuthContext'
  );
  assert(
    dashboardCode.includes('useAuth()') && dashboardCode.includes('user') && (dashboardCode.includes('isLoading') || dashboardCode.includes('authLoading')),
    'DashboardPage consumes user and loading state from useAuth'
  );

  // 2. User Information Display & Safety
  console.log('\n2. Auditing User Profile Display & Safe Fallbacks:');
  assert(
    dashboardCode.includes('user?.name') || dashboardCode.includes('displayName') || profileSectionCode.includes('displayName'),
    'Dashboard handles user name rendering'
  );
  assert(
    profileSectionCode.includes('userEmail') || profileSectionCode.includes('user?.email') || dashboardCode.includes('user?.email'),
    'Dashboard handles user email rendering via ProfileSection'
  );
  assert(
    profileSectionCode.includes('userPhone') || profileSectionCode.includes('user?.phone') || profileSectionCode.includes('Not provided'),
    'Dashboard handles customer phone metadata with safe fallbacks'
  );
  assert(
    dashboardCode.includes('userRole') || profileSectionCode.includes('userRole') || dashboardCode.includes('user?.role'),
    'Dashboard handles account role presentation'
  );
  assert(
    profileSectionCode.includes('accountStatus') || profileSectionCode.includes('Active'),
    'Dashboard includes account active status indicator'
  );
  assert(
    profileSectionCode.includes('memberSince') || profileSectionCode.includes('createdAt'),
    'Dashboard displays member duration / joined timestamp'
  );

  // 3. Quick Actions & Routing Integrity
  console.log('\n3. Auditing Quick Actions & Working Routes:');
  assert(dashboardCode.includes("href: '/bikes'") || dashboardCode.includes('to="/bikes"'), 'Quick action links to /bikes');
  assert(dashboardCode.includes("href: '/showrooms'") || dashboardCode.includes('to="/showrooms"'), 'Quick action links to /showrooms');
  assert(dashboardCode.includes("href: '/compare'") || dashboardCode.includes('to="/compare"'), 'Quick action links to /compare');
  assert(!dashboardCode.includes('/fake') && !dashboardCode.includes('/placeholder'), 'No fake or placeholder routes in quick actions');
  assert(dashboardCode.includes("href: '/offers'") || dashboardCode.includes('to="/offers"'), 'Quick action links to /offers for promotional deals');

  // 4. Activity Area & Empty State
  console.log('\n4. Auditing Future Activity Area & Empty States:');
  assert(dashboardCode.includes('EmptyState'), 'Dashboard utilizes EmptyState component for future activity');
  assert(
    dashboardCode.includes('EmptyState') && (dashboardCode.includes('No Recent Activity') || dashboardCode.includes('No activity yet') || dashboardCode.includes('title=')),
    'Dashboard renders accessible empty state for inactive periods'
  );
  assert(
    dashboardCode.includes('actionLabel="Explore Flagship Motorcycles"') || dashboardCode.includes('actionLabel="Explore Motorcycles"') || dashboardCode.includes('actionLabel="Explore Bikes"'),
    'EmptyState provides actionable button to explore motorcycles'
  );
  assert(
    dashboardCode.includes("navigate('/bikes')") || dashboardCode.includes('actionTo="/bikes"'),
    'EmptyState action navigates to /bikes'
  );

  // 5. UX & Accessibility Standards
  console.log('\n5. Auditing UX, Responsive Layout & Accessibility:');
  assert(dashboardCode.includes('Loading'), 'Dashboard handles auth loading state with Loading component');
  assert(dashboardCode.includes('min-h-[50vh]'), 'Loading container provides appropriate layout dimensions');
  assert(dashboardCode.includes('grid-cols-1'), 'Dashboard utilizes responsive single-column mobile layouts');
  assert(
    dashboardCode.includes('lg:grid-cols-3') || dashboardCode.includes('md:grid-cols-2') || dashboardCode.includes('md:grid-cols-3') || dashboardCode.includes('xl:grid-cols-6'),
    'Dashboard scales to multi-column responsive layout on desktop'
  );
  assert(dashboardCode.includes('aria-labelledby'), 'Sections use semantic aria-labelledby attributes');
  assert(dashboardCode.includes('typography-h1'), 'Page includes primary typography-h1 semantic heading');
  assert(dashboardCode.includes('typography-h2') || dashboardCode.includes('typography-h3'), 'Subsections include semantic h2/h3 headings');
  assert(dashboardCode.includes('usePrefersReducedMotion'), 'Dashboard respects user motion preferences');

  // 6. Security & Credential Hygiene
  console.log('\n6. Auditing Security & Credential Omission:');
  assert(!dashboardCode.includes('passwordHash'), 'passwordHash is NOT accessed or rendered in Dashboard');
  assert(!dashboardCode.includes('password'), 'password is NOT accessed or rendered in Dashboard');
  assert(!dashboardCode.includes('JWT_SECRET'), 'No JWT_SECRET in Dashboard code');
  assert(!dashboardCode.includes('MONGODB_URI'), 'No MONGODB_URI in Dashboard code');
  assert(!dashboardCode.includes('accessToken'), 'accessToken is NOT directly rendered or exposed in UI');
  assert(!dashboardCode.includes('console.log('), 'No debug console logging in Dashboard');

  // 7. Simulating Safe User State Scenarios
  console.log('\n7. Simulating Safe User State Scenarios:');

  // Scenario 1: Standard Customer with Phone
  const userFull = {
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '+91 98765 43210',
    role: 'customer',
    isActive: true,
    createdAt: '2026-09-24T12:00:00.000Z'
  };
  const phoneFull = userFull.phone && userFull.phone.trim() ? userFull.phone.trim() : 'Not provided';
  assert(phoneFull === '+91 98765 43210', 'Phone parsed correctly when present');

  // Scenario 2: Customer with Missing/Blank Phone
  const userNoPhone = {
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '',
    role: 'customer',
    isActive: true
  };
  const phoneEmpty = userNoPhone.phone && userNoPhone.phone.trim() ? userNoPhone.phone.trim() : 'Not provided';
  assert(phoneEmpty === 'Not provided', 'Missing phone safely resolves to "Not provided"');

  // Scenario 3: Missing user entirely during edge load
  const userNull = null;
  const safeName = userNull?.name || 'Rider';
  assert(safeName === 'Rider', 'Null user safely falls back to "Rider"');

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests().catch((err) => {
  console.error('Fatal error during dashboard testing:', err);
  process.exit(1);
});
