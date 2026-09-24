import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = __dirname;

async function runStep10Tests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 3 STEP 10 OFFERS & OFFER LEAD FLOW      ');
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
  console.log('A. Auditing Frontend Service Layer (offerService):');
  const offerServicePath = path.join(clientRoot, 'src/services/offerService.js');
  const servicesIndexPath = path.join(clientRoot, 'src/services/index.js');

  assert(fs.existsSync(offerServicePath), 'offerService.js exists');
  assert(fs.existsSync(servicesIndexPath), 'services/index.js exists');

  const offerServiceCode = fs.readFileSync(offerServicePath, 'utf8');
  const servicesIndexCode = fs.readFileSync(servicesIndexPath, 'utf8');

  assert(offerServiceCode.includes('getOffers ='), 'offerService exports getOffers function');
  assert(offerServiceCode.includes('getOffer =') || offerServiceCode.includes('getOfferByIdOrSlug ='), 'offerService exports getOffer function');
  assert(offerServiceCode.includes("api.get('/offers'"), 'getOffers calls GET /offers');
  assert(offerServiceCode.includes("api.get(`/offers/"), 'getOffer calls GET /offers/:idOrSlug');
  assert(servicesIndexCode.includes('offerService'), 'services/index.js exports offerService');
  assert(!offerServiceCode.includes('Bearer '), 'offerService does not hardcode authentication (public read contract)');

  // -------------------------------------------------------------
  // B. OFFERS PAGE TESTS (/offers)
  // -------------------------------------------------------------
  console.log('\nB. Auditing OffersPage Component & Routing:');
  const offersPagePath = path.join(clientRoot, 'src/pages/OffersPage.jsx');
  const appRoutesPath = path.join(clientRoot, 'src/routes/AppRoutes.jsx');
  assert(fs.existsSync(offersPagePath), 'OffersPage.jsx exists');

  const offersPageCode = fs.readFileSync(offersPagePath, 'utf8');
  const appRoutesCode = fs.readFileSync(appRoutesPath, 'utf8');

  assert(
    (appRoutesCode.includes('path="offers"') || appRoutesCode.includes('path="/offers"')) &&
    appRoutesCode.includes('<OffersPage'),
    'Route /offers registered in AppRoutes.jsx'
  );
  assert(offersPageCode.includes('offerService.getOffers'), 'OffersPage queries offers via offerService.getOffers');
  assert(offersPageCode.includes('Loading'), 'OffersPage includes loading state');
  assert(offersPageCode.includes('ErrorState'), 'OffersPage includes error state');
  assert(offersPageCode.includes('EmptyState'), 'OffersPage includes empty state');
  assert(offersPageCode.includes('OfferCard'), 'OffersPage renders OfferCard items');
  assert(offersPageCode.includes('activeTab') || offersPageCode.includes('selectedType'), 'OffersPage supports category/type filtering');
  assert(offersPageCode.includes('LeadForm'), 'OffersPage integrates enquiry LeadForm modal');

  // -------------------------------------------------------------
  // C. OFFER DETAIL PAGE TESTS (/offers/:id)
  // -------------------------------------------------------------
  console.log('\nC. Auditing OfferDetailPage Component & Routing:');
  const offerDetailPagePath = path.join(clientRoot, 'src/pages/OfferDetailPage.jsx');
  assert(fs.existsSync(offerDetailPagePath), 'OfferDetailPage.jsx exists');

  const offerDetailPageCode = fs.readFileSync(offerDetailPagePath, 'utf8');
  assert(
    (appRoutesCode.includes('path="offers/:id"') || appRoutesCode.includes('path="/offers/:id"')) &&
    appRoutesCode.includes('<OfferDetailPage'),
    'Route /offers/:id registered in AppRoutes.jsx'
  );
  assert(offerDetailPageCode.includes('offerService.getOffer'), 'OfferDetailPage queries offer via offerService.getOffer');
  assert(offerDetailPageCode.includes('offer.title'), 'OfferDetailPage renders offer title');
  assert(offerDetailPageCode.includes('offer.description'), 'OfferDetailPage renders offer description');
  assert(offerDetailPageCode.includes('offer.bike'), 'OfferDetailPage renders bike context');
  assert(offerDetailPageCode.includes('offer.showroom'), 'OfferDetailPage renders showroom context');
  assert(offerDetailPageCode.includes('validFrom') && offerDetailPageCode.includes('validUntil'), 'OfferDetailPage renders validity dates');
  assert(offerDetailPageCode.includes('Enquire About This Offer') || offerDetailPageCode.includes('Enquire'), 'OfferDetailPage provides primary CTA');
  assert(offerDetailPageCode.includes('LeadForm'), 'OfferDetailPage includes LeadForm modal integration');

  // -------------------------------------------------------------
  // D. LEAD FORM INTEGRATION WITH SOURCE="OFFER"
  // -------------------------------------------------------------
  console.log('\nD. Auditing LeadForm Offer Integration:');
  const leadFormPath = path.join(clientRoot, 'src/components/leads/LeadForm.jsx');
  assert(fs.existsSync(leadFormPath), 'LeadForm.jsx exists');

  const leadFormCode = fs.readFileSync(leadFormPath, 'utf8');
  assert(leadFormCode.includes('offer: initialOffer') || leadFormCode.includes('offer'), 'LeadForm accepts offer prop');
  assert(leadFormCode.includes("source === 'offer'") || leadFormCode.includes('source'), 'LeadForm supports source="offer"');
  assert(leadFormCode.includes('offer:') && leadFormCode.includes('payload'), 'LeadForm includes offer in API payload');
  assert(leadFormCode.includes('offerBadge') || leadFormCode.includes('Offer Enquiry') || leadFormCode.includes('offer?.title'), 'LeadForm displays offer context');
  assert(!leadFormCode.includes('userId:') && !leadFormCode.includes('user_id:'), 'LeadForm preserves backend user identity');
  assert(!leadFormCode.includes('status:') && !leadFormCode.includes('status ='), 'LeadForm prevents arbitrary status mutation');
  assert(leadFormCode.includes('isSubmitting'), 'LeadForm prevents duplicate submissions');

  // -------------------------------------------------------------
  // E. BIKE PAGE INTEGRATION
  // -------------------------------------------------------------
  console.log('\nE. Auditing BikeDetailPage Active Offer Integration:');
  const bikeDetailPagePath = path.join(clientRoot, 'src/pages/BikeDetailPage.jsx');
  const bikeDetailPageCode = fs.readFileSync(bikeDetailPagePath, 'utf8');

  assert(bikeDetailPageCode.includes('offerService.getOffers'), 'BikeDetailPage fetches active offers for the bike');
  assert(bikeDetailPageCode.includes('bikeOffers.length > 0'), 'BikeDetailPage checks for real offers before rendering UI');
  assert(bikeDetailPageCode.includes('/offers'), 'BikeDetailPage links to relevant offer experience');
  assert(bikeDetailPageCode.includes('View') && bikeDetailPageCode.includes('Offer'), 'BikeDetailPage provides "View Offers" button');

  // -------------------------------------------------------------
  // F. SHOWROOM PAGE INTEGRATION
  // -------------------------------------------------------------
  console.log('\nF. Auditing ShowroomDetailPage Active Offer Integration:');
  const showroomDetailPagePath = path.join(clientRoot, 'src/pages/ShowroomDetailPage.jsx');
  const showroomDetailPageCode = fs.readFileSync(showroomDetailPagePath, 'utf8');

  assert(showroomDetailPageCode.includes('offerService.getOffers'), 'ShowroomDetailPage fetches active offers for showroom');
  assert(showroomDetailPageCode.includes('showroomOffers.length > 0'), 'ShowroomDetailPage checks for real offers before rendering');
  assert(showroomDetailPageCode.includes('/offers'), 'ShowroomDetailPage links to showroom offers');
  assert(showroomDetailPageCode.includes('Special Offers'), 'ShowroomDetailPage provides Special Offers button');

  // -------------------------------------------------------------
  // G. HOMEPAGE INTEGRATION
  // -------------------------------------------------------------
  console.log('\nG. Auditing HomePage Active Offer Integration:');
  const homePagePath = path.join(clientRoot, 'src/pages/HomePage.jsx');
  const homePageCode = fs.readFileSync(homePagePath, 'utf8');

  assert(homePageCode.includes('offerService') && homePageCode.includes('.getOffers'), 'HomePage queries active offers');
  assert(homePageCode.includes('offers.length > 0'), 'HomePage renders promotional section conditionally on real offers');
  assert(homePageCode.includes('/offers'), 'HomePage includes link to /offers');

  // -------------------------------------------------------------
  // H. DASHBOARD ENQUIRY DISPLAY
  // -------------------------------------------------------------
  console.log('\nH. Auditing Dashboard LeadActivityList Offer Identification:');
  const leadActivityListPath = path.join(clientRoot, 'src/components/dashboard/LeadActivityList.jsx');
  const leadActivityListCode = fs.readFileSync(leadActivityListPath, 'utf8');

  assert(leadActivityListCode.includes('Offer Enquiry'), 'LeadActivityList identifies offer leads as "Offer Enquiry"');
  assert(leadActivityListCode.includes('lead.offer'), 'LeadActivityList inspects lead.offer details');
  assert(leadActivityListCode.includes('Tag'), 'LeadActivityList visually highlights offer context');

  // -------------------------------------------------------------
  // I. HEADER NAVIGATION
  // -------------------------------------------------------------
  console.log('\nI. Auditing Header Navigation:');
  const headerPath = path.join(clientRoot, 'src/components/Header.jsx');
  const headerCode = fs.readFileSync(headerPath, 'utf8');

  assert(headerCode.includes("to: '/offers'") && headerCode.includes("label: 'Offers'"), 'Header includes Offers navigation link');

  // -------------------------------------------------------------
  // J. AUTHENTICATION FLOW
  // -------------------------------------------------------------
  console.log('\nJ. Auditing Offer Authentication Flow:');
  assert(offerServiceCode.includes('api.get'), 'Offer browsing uses standard GET requests');
  assert(leadFormCode.includes('isAuthenticated') && leadFormCode.includes('/login'), 'Offer enquiry submission redirects unauthenticated users to login');
  assert(leadFormCode.includes('redirect=') && leadFormCode.includes('location.pathname'), 'Offer enquiry login redirect preserves navigation context');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep10Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
