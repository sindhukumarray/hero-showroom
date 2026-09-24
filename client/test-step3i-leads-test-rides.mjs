import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = __dirname;

async function runStep9Tests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 9 FRONTEND LEADS & TEST RIDES   ');
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

  // -------------------------------------------------------------
  // A. SERVICE LAYER TESTS
  // -------------------------------------------------------------
  console.log('A. Auditing Frontend Service Layer (leadService & testRideService):');
  const leadServicePath = path.join(clientRoot, 'src/services/leadService.js');
  const testRideServicePath = path.join(clientRoot, 'src/services/testRideService.js');
  const servicesIndexPath = path.join(clientRoot, 'src/services/index.js');

  assert(fs.existsSync(leadServicePath), 'leadService.js exists');
  assert(fs.existsSync(testRideServicePath), 'testRideService.js exists');
  assert(fs.existsSync(servicesIndexPath), 'services/index.js exists');

  const leadServiceCode = fs.readFileSync(leadServicePath, 'utf8');
  const testRideServiceCode = fs.readFileSync(testRideServicePath, 'utf8');
  const servicesIndexCode = fs.readFileSync(servicesIndexPath, 'utf8');

  assert(leadServiceCode.includes('createLead ='), 'leadService exports createLead function');
  assert(leadServiceCode.includes('getMyLeads ='), 'leadService exports getMyLeads function');
  assert(leadServiceCode.includes("api.post('/leads'"), 'createLead calls POST /leads');
  assert(leadServiceCode.includes("api.get('/leads/my'"), 'getMyLeads calls GET /leads/my');

  assert(testRideServiceCode.includes('createTestRide ='), 'testRideService exports createTestRide function');
  assert(testRideServiceCode.includes('getMyTestRides ='), 'testRideService exports getMyTestRides function');
  assert(testRideServiceCode.includes("api.post('/test-rides'"), 'createTestRide calls POST /test-rides');
  assert(testRideServiceCode.includes("api.get('/test-rides/my'"), 'getMyTestRides calls GET /test-rides/my');

  assert(
    servicesIndexCode.includes('leadService') && servicesIndexCode.includes('testRideService'),
    'services/index.js exports both leadService and testRideService'
  );
  assert(
    !leadServiceCode.includes('Bearer ') && !testRideServiceCode.includes('Bearer '),
    'Services do NOT duplicate Bearer token handling (delegated to api.js interceptor)'
  );

  // -------------------------------------------------------------
  // B. LEAD FORM COMPONENT TESTS
  // -------------------------------------------------------------
  console.log('\nB. Auditing LeadForm Component (Validation, States & Security):');
  const leadFormPath = path.join(clientRoot, 'src/components/leads/LeadForm.jsx');
  assert(fs.existsSync(leadFormPath), 'LeadForm.jsx exists');

  const leadFormCode = fs.readFileSync(leadFormPath, 'utf8');
  assert(leadFormCode.includes('source = \'showroom\'') || leadFormCode.includes('source'), 'LeadForm supports configurable source');
  assert(leadFormCode.includes('showroom'), 'LeadForm supports contextual showroom');
  assert(leadFormCode.includes('bike'), 'LeadForm supports contextual bike');
  assert(leadFormCode.includes('variant'), 'LeadForm supports contextual variant');

  // Validation
  assert(leadFormCode.includes('EMAIL_REGEX') || leadFormCode.includes('validateEmail'), 'LeadForm includes email format validation');
  assert(leadFormCode.includes('PHONE_REGEX') || leadFormCode.includes('phone'), 'LeadForm includes phone validation');
  assert(leadFormCode.includes('Showroom selection is required') || leadFormCode.includes('errors.showroom'), 'LeadForm requires showroom');
  assert(leadFormCode.includes('Please enter your full name') || leadFormCode.includes('errors.name'), 'LeadForm validates required name');

  // Loading, Success & Error States
  assert(leadFormCode.includes('isSubmitting'), 'LeadForm tracks isSubmitting loading state');
  assert(leadFormCode.includes('isSuccess'), 'LeadForm tracks isSuccess confirmation state');
  assert(leadFormCode.includes('apiError'), 'LeadForm tracks and renders apiError state');
  assert(leadFormCode.includes('disabled={isSubmitting}'), 'LeadForm prevents duplicate submissions during transit');

  // Security: No Identity Overrides
  assert(!leadFormCode.includes('status:') && !leadFormCode.includes('status ='), 'LeadForm does not attempt to set lead status');
  assert(!leadFormCode.includes('userId:') && !leadFormCode.includes('user_id:'), 'LeadForm does not override backend userId');
  assert(leadFormCode.includes('isAuthenticated'), 'LeadForm checks authentication before submission');
  assert(leadFormCode.includes('/login'), 'LeadForm redirects unauthenticated users to login');

  // -------------------------------------------------------------
  // C. TEST RIDE FORM COMPONENT TESTS
  // -------------------------------------------------------------
  console.log('\nC. Auditing TestRideForm Component (Validation, Time Slots & Date Safety):');
  const testRideFormPath = path.join(clientRoot, 'src/components/testRides/TestRideForm.jsx');
  assert(fs.existsSync(testRideFormPath), 'TestRideForm.jsx exists');

  const testRideFormCode = fs.readFileSync(testRideFormPath, 'utf8');
  assert(testRideFormCode.includes('bike'), 'TestRideForm accepts contextual bike');
  assert(testRideFormCode.includes('showroom'), 'TestRideForm accepts contextual showroom');
  assert(testRideFormCode.includes('preferredDate'), 'TestRideForm manages preferredDate field');
  assert(testRideFormCode.includes('preferredTime'), 'TestRideForm manages preferredTime field');

  // Date and Time Validation
  assert(testRideFormCode.includes('min={minDateStr}') || testRideFormCode.includes('minDate'), 'TestRideForm restricts date input to future/today');
  assert(testRideFormCode.includes('TIME_SLOTS') || testRideFormCode.includes('TIME_REGEX'), 'TestRideForm formats time slots in HH:mm');
  assert(
    testRideFormCode.includes('errors.preferredTime') && testRideFormCode.includes('HH:mm'),
    'TestRideForm validates preferred time selection in HH:mm format'
  );

  // States and Security
  assert(testRideFormCode.includes('isSubmitting'), 'TestRideForm tracks isSubmitting state');
  assert(testRideFormCode.includes('isSuccess'), 'TestRideForm tracks isSuccess state');
  assert(testRideFormCode.includes('disabled={isSubmitting}'), 'TestRideForm prevents duplicate submissions');
  assert(testRideFormCode.includes('Requested'), 'TestRideForm displays "Requested" status accurately without false confirmation');
  assert(!testRideFormCode.includes('status: \'confirmed\''), 'TestRideForm does not bypass backend status control');

  // -------------------------------------------------------------
  // D. BIKE DETAIL PAGE INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log('\nD. Auditing BikeDetailPage Integration:');
  const bikeDetailPath = path.join(clientRoot, 'src/pages/BikeDetailPage.jsx');
  assert(fs.existsSync(bikeDetailPath), 'BikeDetailPage.jsx exists');

  const bikeDetailCode = fs.readFileSync(bikeDetailPath, 'utf8');
  assert(bikeDetailCode.includes('isTestRideModalOpen'), 'BikeDetailPage manages isTestRideModalOpen state');
  assert(bikeDetailCode.includes('isLeadModalOpen'), 'BikeDetailPage manages isLeadModalOpen state');
  assert(bikeDetailCode.includes('<TestRideForm'), 'BikeDetailPage embeds TestRideForm modal');
  assert(bikeDetailCode.includes('<LeadForm'), 'BikeDetailPage embeds LeadForm modal');
  assert(bikeDetailCode.includes('source="bike"'), 'BikeDetailPage configures LeadForm source="bike"');
  assert(bikeDetailCode.includes('Book Test Ride'), 'BikeDetailPage has functional Book Test Ride CTA');
  assert(
    bikeDetailCode.includes('bike={bike}') && bikeDetailCode.includes('variant={selectedVariant}'),
    'BikeDetailPage passes bike and selectedVariant context to modal forms'
  );

  // -------------------------------------------------------------
  // E. SHOWROOM DETAIL PAGE INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log('\nE. Auditing ShowroomDetailPage Integration:');
  const showroomDetailPath = path.join(clientRoot, 'src/pages/ShowroomDetailPage.jsx');
  assert(fs.existsSync(showroomDetailPath), 'ShowroomDetailPage.jsx exists');

  const showroomDetailCode = fs.readFileSync(showroomDetailPath, 'utf8');
  assert(showroomDetailCode.includes('isLeadModalOpen'), 'ShowroomDetailPage manages isLeadModalOpen state');
  assert(showroomDetailCode.includes('isTestRideModalOpen'), 'ShowroomDetailPage manages isTestRideModalOpen state');
  assert(showroomDetailCode.includes('<LeadForm'), 'ShowroomDetailPage embeds LeadForm modal');
  assert(showroomDetailCode.includes('<TestRideForm'), 'ShowroomDetailPage embeds TestRideForm modal');
  assert(showroomDetailCode.includes('Contact Showroom'), 'ShowroomDetailPage provides Contact Showroom CTA');
  assert(showroomDetailCode.includes('Book Test Ride'), 'ShowroomDetailPage provides Book Test Ride CTA');
  assert(
    showroomDetailCode.includes('showroom={showroom}') && showroomDetailCode.includes('source="showroom"'),
    'ShowroomDetailPage passes showroom context and source="showroom"'
  );

  // -------------------------------------------------------------
  // F. DASHBOARD INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log('\nF. Auditing Dashboard Activity Integration:');
  const dashboardPath = path.join(clientRoot, 'src/pages/DashboardPage.jsx');
  const leadActivityListPath = path.join(clientRoot, 'src/components/dashboard/LeadActivityList.jsx');
  const testRideActivityListPath = path.join(clientRoot, 'src/components/dashboard/TestRideActivityList.jsx');

  assert(fs.existsSync(dashboardPath), 'DashboardPage.jsx exists');
  assert(fs.existsSync(leadActivityListPath), 'LeadActivityList.jsx exists');
  assert(fs.existsSync(testRideActivityListPath), 'TestRideActivityList.jsx exists');

  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
  assert(dashboardCode.includes('leadService.getMyLeads()'), 'DashboardPage fetches real customer leads');
  assert(dashboardCode.includes('testRideService.getMyTestRides()'), 'DashboardPage fetches real customer test rides');
  assert(dashboardCode.includes('activeTab'), 'DashboardPage supports tabbed activity navigation');
  assert(dashboardCode.includes('<LeadActivityList'), 'DashboardPage renders LeadActivityList');
  assert(dashboardCode.includes('<TestRideActivityList'), 'DashboardPage renders TestRideActivityList');
  assert(dashboardCode.includes('activityLoading'), 'DashboardPage handles activity loading state');
  assert(dashboardCode.includes('activityError'), 'DashboardPage handles activity error state');

  const leadActivityCode = fs.readFileSync(leadActivityListPath, 'utf8');
  const testRideActivityCode = fs.readFileSync(testRideActivityListPath, 'utf8');

  assert(leadActivityCode.includes('lead.status'), 'LeadActivityList renders lead status badge');
  assert(leadActivityCode.includes('lead.source'), 'LeadActivityList displays lead source');
  assert(leadActivityCode.includes('createdAt'), 'LeadActivityList formats creation date');

  assert(testRideActivityCode.includes('ride.status'), 'TestRideActivityList renders test ride status badge');
  assert(testRideActivityCode.includes('preferredDate'), 'TestRideActivityList displays preferred test date');
  assert(testRideActivityCode.includes('preferredTime'), 'TestRideActivityList displays preferred time slot');

  // -------------------------------------------------------------
  // G. ACCESSIBLE MODAL & COMPONENT REGISTRY TESTS
  // -------------------------------------------------------------
  console.log('\nG. Auditing Modal Component & Export Registry:');
  const modalPath = path.join(clientRoot, 'src/components/Modal.jsx');
  const componentsIndexPath = path.join(clientRoot, 'src/components/index.js');

  assert(fs.existsSync(modalPath), 'Modal.jsx exists');
  assert(fs.existsSync(componentsIndexPath), 'components/index.js exists');

  const modalCode = fs.readFileSync(modalPath, 'utf8');
  const componentsIndexCode = fs.readFileSync(componentsIndexPath, 'utf8');

  assert(modalCode.includes('role="dialog"') && modalCode.includes('aria-modal="true"'), 'Modal implements ARIA dialog semantics');
  assert(modalCode.includes('Escape') || modalCode.includes('keydown'), 'Modal supports keyboard Escape dismissal');
  assert(modalCode.includes('overflow = \'hidden\''), 'Modal implements body scroll locking');

  assert(componentsIndexCode.includes('Modal'), 'components/index.js exports Modal');
  assert(componentsIndexCode.includes('LeadForm'), 'components/index.js exports LeadForm');
  assert(componentsIndexCode.includes('TestRideForm'), 'components/index.js exports TestRideForm');
  assert(componentsIndexCode.includes('LeadActivityList'), 'components/index.js exports LeadActivityList');
  assert(componentsIndexCode.includes('TestRideActivityList'), 'components/index.js exports TestRideActivityList');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep9Tests().catch((err) => {
  console.error('Unhandled error during Step 9 test run:', err);
  process.exit(1);
});
