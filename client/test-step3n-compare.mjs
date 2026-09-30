/**
 * HERO SHOWROOM — Phase 3 Step 14 Bike Compare Foundation Test Suite
 * Comprehensive automated verification for compare state architecture,
 * component structure, persistence, constraints, spec matrix, and edge cases.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
console.log(' HERO SHOWROOM — PHASE 3 STEP 14 BIKE COMPARE AUDIT & TESTS    ');
console.log('================================================================\n');

// ============================================================
// 1. Compare State Architecture & Context Audit
// ============================================================
console.log('1. Auditing Compare Context & Architecture:');

const contextPath = path.join(CLIENT_SRC, 'context', 'CompareContext.jsx');
assert(fileExists(contextPath), 'client/src/context/CompareContext.jsx exists');
assert(fileContains(contextPath, 'CompareProvider'), 'CompareContext exports CompareProvider');
assert(fileContains(contextPath, 'useCompare'), 'CompareContext exports useCompare hook');
assert(fileContains(contextPath, 'MAX_COMPARE_BIKES = 3'), 'CompareContext enforces max 3 bikes constraint');
assert(fileContains(contextPath, 'MIN_COMPARE_BIKES = 2'), 'CompareContext defines min 2 bikes for comparison');
assert(fileContains(contextPath, 'COMPARE_STORAGE_KEY'), 'CompareContext defines localStorage key');
assert(fileContains(contextPath, 'localStorage.getItem'), 'CompareContext reads from localStorage');
assert(fileContains(contextPath, 'localStorage.setItem'), 'CompareContext persists to localStorage');
assert(fileContains(contextPath, 'localStorage.removeItem'), 'CompareContext cleans up localStorage');
assert(fileContains(contextPath, 'isInCompare'), 'CompareContext provides isInCompare helper');
assert(fileContains(contextPath, 'addBike'), 'CompareContext provides addBike function');
assert(fileContains(contextPath, 'removeBike'), 'CompareContext provides removeBike function');
assert(fileContains(contextPath, 'toggleBike'), 'CompareContext provides toggleBike function');
assert(fileContains(contextPath, 'clearCompare'), 'CompareContext provides clearCompare function');
assert(fileContains(contextPath, 'isFull'), 'CompareContext exposes isFull boolean');
assert(fileContains(contextPath, 'canCompare'), 'CompareContext exposes canCompare boolean');

// Provider in App.jsx
const appPath = path.join(CLIENT_SRC, 'App.jsx');
assert(fileContains(appPath, 'CompareProvider'), 'App.jsx wraps routes in CompareProvider');

// ============================================================
// 2. Compare UI Components Audit
// ============================================================
console.log('\n2. Auditing Compare UI Components:');

const btnPath = path.join(CLIENT_SRC, 'components', 'compare', 'CompareButton.jsx');
assert(fileExists(btnPath), 'CompareButton.jsx exists');
assert(fileContains(btnPath, 'useCompare'), 'CompareButton consumes useCompare');
assert(fileContains(btnPath, 'aria-pressed'), 'CompareButton defines accessible aria-pressed');
assert(fileContains(btnPath, 'aria-label'), 'CompareButton defines accessible aria-label');
assert(fileContains(btnPath, 'isLimitReached'), 'CompareButton handles limit-reached state');
assert(fileContains(btnPath, 'In Compare'), 'CompareButton displays selected indicator');
assert(fileContains(btnPath, 'Add to Compare'), 'CompareButton displays unselected CTA');

const itemPath = path.join(CLIENT_SRC, 'components', 'compare', 'CompareBikeItem.jsx');
assert(fileExists(itemPath), 'CompareBikeItem.jsx exists');
assert(fileContains(itemPath, 'onRemove'), 'CompareBikeItem provides remove action');
assert(fileContains(itemPath, 'formatCurrency'), 'CompareBikeItem uses standard currency formatter');
assert(fileContains(itemPath, 'aria-label'), 'CompareBikeItem remove button has accessible label');

const barPath = path.join(CLIENT_SRC, 'components', 'compare', 'CompareBar.jsx');
assert(fileExists(barPath), 'CompareBar.jsx exists');
assert(fileContains(barPath, 'useCompare'), 'CompareBar consumes useCompare');
assert(fileContains(barPath, 'CompareBikeItem'), 'CompareBar renders CompareBikeItem chips');
assert(fileContains(barPath, 'canCompare'), 'CompareBar checks canCompare requirement');
assert(fileContains(barPath, 'disabled={!canCompare}'), 'CompareBar disables CTA with fewer than 2 bikes');
assert(fileContains(barPath, 'clearCompare'), 'CompareBar provides clear all action');
assert(fileContains(barPath, 'to="/compare"'), 'CompareBar CTA navigates to /compare');
assert(fileContains(barPath, 'role="region"'), 'CompareBar defines accessible region landmark');

const emptyPath = path.join(CLIENT_SRC, 'components', 'compare', 'CompareEmptyState.jsx');
assert(fileExists(emptyPath), 'CompareEmptyState.jsx exists');
assert(fileContains(emptyPath, 'to="/bikes"'), 'CompareEmptyState links to motorcycle catalogue');

// Components Barrel
const compareIndex = path.join(CLIENT_SRC, 'components', 'compare', 'index.js');
assert(fileExists(compareIndex), 'components/compare/index.js barrel exists');
assert(fileContains(compareIndex, 'CompareButton'), 'compare/index.js exports CompareButton');
assert(fileContains(compareIndex, 'CompareBikeItem'), 'compare/index.js exports CompareBikeItem');
assert(fileContains(compareIndex, 'CompareBar'), 'compare/index.js exports CompareBar');
assert(fileContains(compareIndex, 'CompareEmptyState'), 'compare/index.js exports CompareEmptyState');

const compIndex = path.join(CLIENT_SRC, 'components', 'index.js');
assert(fileContains(compIndex, 'CompareButton'), 'components/index.js exports CompareButton');
assert(fileContains(compIndex, 'CompareBar'), 'components/index.js exports CompareBar');

// ============================================================
// 3. Layout, Navigation, and Page Integration Audit
// ============================================================
console.log('\n3. Auditing Layout, Header, and Catalogue Pages:');

const rootLayoutPath = path.join(CLIENT_SRC, 'layouts', 'RootLayout.jsx');
assert(fileContains(rootLayoutPath, 'CompareBar'), 'RootLayout.jsx renders CompareBar');
assert(fileContains(rootLayoutPath, 'useCompare'), 'RootLayout.jsx consumes useCompare for dynamic spacing');

const headerPath = path.join(CLIENT_SRC, 'components', 'Header.jsx');
assert(fileContains(headerPath, 'useCompare'), 'Header.jsx consumes useCompare');
assert(fileContains(headerPath, 'compareCount'), 'Header.jsx monitors compareCount');
assert(fileContains(headerPath, "item.to === '/compare'"), 'Header.jsx targets /compare nav link');

const bikesPagePath = path.join(CLIENT_SRC, 'pages', 'BikesPage.jsx');
assert(fileContains(bikesPagePath, 'CompareButton'), 'BikesPage.jsx renders CompareButton on bike cards');

const bikeDetailPath = path.join(CLIENT_SRC, 'pages', 'BikeDetailPage.jsx');
assert(fileContains(bikeDetailPath, 'CompareButton'), 'BikeDetailPage.jsx renders CompareButton');

const homePagePath = path.join(CLIENT_SRC, 'pages', 'HomePage.jsx');
assert(fileContains(homePagePath, 'CompareButton'), 'HomePage.jsx renders CompareButton on featured bikes');

// ============================================================
// 4. ComparePage Specifications & Matrix Audit
// ============================================================
console.log('\n4. Auditing ComparePage Structure & Specification Matrix:');

const comparePagePath = path.join(CLIENT_SRC, 'pages', 'ComparePage.jsx');
assert(fileExists(comparePagePath), 'ComparePage.jsx exists');
assert(fileContains(comparePagePath, 'useCompare'), 'ComparePage consumes useCompare');
assert(fileContains(comparePagePath, 'CompareEmptyState'), 'ComparePage renders CompareEmptyState when count === 0');
assert(fileContains(comparePagePath, 'compareCount === 1'), 'ComparePage has dedicated 1-bike guidance state');
assert(fileContains(comparePagePath, 'formatPriceRange'), 'ComparePage formats price ranges');
assert(fileContains(comparePagePath, 'displacementCc'), 'ComparePage checks engine displacementCc');
assert(fileContains(comparePagePath, 'maxPower'), 'ComparePage displays maximum power');
assert(fileContains(comparePagePath, 'maxTorque'), 'ComparePage displays maximum torque');
assert(fileContains(comparePagePath, 'cooling'), 'ComparePage displays cooling system');
assert(fileContains(comparePagePath, 'emissionStandard'), 'ComparePage displays emission standard');
assert(fileContains(comparePagePath, 'estimatedKmpl'), 'ComparePage displays estimated mileage');
assert(fileContains(comparePagePath, 'certifiedRangeKm'), 'ComparePage displays certified range');
assert(fileContains(comparePagePath, 'brakes'), 'ComparePage displays braking parameters');
assert(fileContains(comparePagePath, 'absType'), 'ComparePage displays ABS specifications');
assert(fileContains(comparePagePath, 'highlightDiffs'), 'ComparePage supports highlight differences feature');
assert(fileContains(comparePagePath, 'clearCompare'), 'ComparePage provides clear all action');
assert(fileContains(comparePagePath, 'removeBike'), 'ComparePage provides individual bike removal');

// ============================================================
// 5. Pure Logic State Machine & In-Memory Simulation
// ============================================================
console.log('\n5. Simulating Compare State Machine & Edge Cases:');

// In-memory simulation of CompareContext logic
class CompareStateMachine {
  constructor(initialIds = []) {
    this.storage = { hero_compare_bike_ids: JSON.stringify(initialIds) };
    this.maxAllowed = 3;
    this.minRequired = 2;
    this.selectedIds = [...initialIds];
    this.bikes = [];
  }

  save() {
    if (this.selectedIds.length === 0) {
      delete this.storage.hero_compare_bike_ids;
    } else {
      this.storage.hero_compare_bike_ids = JSON.stringify(this.selectedIds);
    }
  }

  isInCompare(id) {
    return this.selectedIds.includes(String(id));
  }

  addBike(bike) {
    if (!bike || !bike._id) return { success: false, reason: 'invalid_bike' };
    const id = String(bike._id);
    if (this.isInCompare(id)) return { success: false, reason: 'already_added' };
    if (this.selectedIds.length >= this.maxAllowed) return { success: false, reason: 'limit_reached' };
    this.selectedIds.push(id);
    this.bikes.push(bike);
    this.save();
    return { success: true };
  }

  removeBike(id) {
    const sId = String(id);
    this.selectedIds = this.selectedIds.filter((item) => item !== sId);
    this.bikes = this.bikes.filter((b) => b._id !== sId);
    this.save();
  }

  clearCompare() {
    this.selectedIds = [];
    this.bikes = [];
    this.save();
  }

  get count() {
    return this.selectedIds.length;
  }

  get isFull() {
    return this.selectedIds.length >= this.maxAllowed;
  }

  get canCompare() {
    return this.selectedIds.length >= this.minRequired;
  }

  resolveCatalogue(catalogue) {
    const matched = [];
    const validIds = [];
    for (const id of this.selectedIds) {
      const found = catalogue.find((b) => b._id === id);
      if (found) {
        matched.push(found);
        validIds.push(id);
      }
    }
    this.selectedIds = validIds;
    this.bikes = matched;
    this.save();
    return matched;
  }
}

const bikeA = { _id: 'bike_001', name: 'Hero Splendor Plus', slug: 'hero-splendor-plus', category: 'Commuter' };
const bikeB = { _id: 'bike_002', name: 'Hero Xpulse 200 4V', slug: 'hero-xpulse-200-4v', category: 'Adventure' };
const bikeC = { _id: 'bike_003', name: 'Hero Karizma XMR', slug: 'hero-karizma-xmr', category: 'Sport' };
const bikeD = { _id: 'bike_004', name: 'Hero Vida V1 Pro', slug: 'hero-vida-v1-pro', category: 'Electric' };

const machine = new CompareStateMachine();

// Test: Initial State
assert(machine.count === 0, 'Initial state: compareCount === 0');
assert(machine.canCompare === false, 'Initial state: canCompare === false');
assert(machine.isFull === false, 'Initial state: isFull === false');

// Test: Add First Bike
const res1 = machine.addBike(bikeA);
assert(res1.success === true, 'Add bike #1 succeeds');
assert(machine.count === 1, 'compareCount === 1 after adding bike #1');
assert(machine.isInCompare('bike_001') === true, 'isInCompare("bike_001") is true');
assert(machine.canCompare === false, 'canCompare remains false with 1 bike (CTA disabled)');

// Test: Duplicate Bike Rejection
const resDup = machine.addBike(bikeA);
assert(resDup.success === false && resDup.reason === 'already_added', 'Duplicate bike #1 is rejected');
assert(machine.count === 1, 'compareCount remains 1 after duplicate attempt');

// Test: Add Second Bike
const res2 = machine.addBike(bikeB);
assert(res2.success === true, 'Add bike #2 succeeds');
assert(machine.count === 2, 'compareCount === 2 after adding bike #2');
assert(machine.canCompare === true, 'canCompare is true with 2 bikes (CTA enabled)');
assert(machine.isFull === false, 'isFull is false with 2 bikes');

// Test: Add Third Bike
const res3 = machine.addBike(bikeC);
assert(res3.success === true, 'Add bike #3 succeeds');
assert(machine.count === 3, 'compareCount === 3 after adding bike #3');
assert(machine.isFull === true, 'isFull is true with 3 bikes');
assert(machine.canCompare === true, 'canCompare is true with 3 bikes');

// Test: Fourth Bike Rejection (Maximum 3 Rule)
const res4 = machine.addBike(bikeD);
assert(res4.success === false && res4.reason === 'limit_reached', 'Fourth bike is rejected due to max-3 rule');
assert(machine.count === 3, 'compareCount remains 3 after 4th bike attempt');
assert(machine.isInCompare('bike_004') === false, 'bike #4 is not in compare list');

// Test: LocalStorage Persistence
const savedRaw = machine.storage.hero_compare_bike_ids;
assert(savedRaw !== undefined, 'LocalStorage key hero_compare_bike_ids exists');
const savedIds = JSON.parse(savedRaw);
assert(savedIds.length === 3 && savedIds.includes('bike_001') && savedIds.includes('bike_002') && savedIds.includes('bike_003'), 'LocalStorage contains exactly the 3 selected bike IDs');

// Test: Remove One Bike
machine.removeBike('bike_002');
assert(machine.count === 2, 'compareCount === 2 after removing bike #2');
assert(machine.isInCompare('bike_002') === false, 'bike #2 is no longer in compare list');
assert(machine.isFull === false, 'isFull becomes false after removing bike');
assert(machine.canCompare === true, 'canCompare remains true with 2 bikes');
const savedAfterRemove = JSON.parse(machine.storage.hero_compare_bike_ids);
assert(savedAfterRemove.length === 2 && !savedAfterRemove.includes('bike_002'), 'LocalStorage reflects removal of bike #2');

// Test: Refresh Persistence Simulation
const machineRefreshed = new CompareStateMachine(savedAfterRemove);
assert(machineRefreshed.count === 2, 'Refreshed state restores count 2 from storage');
assert(machineRefreshed.isInCompare('bike_001') === true, 'Refreshed state preserves bike #1');
assert(machineRefreshed.isInCompare('bike_003') === true, 'Refreshed state preserves bike #3');

// Test: Stale / Deleted Bike ID Pruning
const machineWithStale = new CompareStateMachine(['bike_001', 'deleted_bike_999']);
assert(machineWithStale.count === 2, 'Loaded with 1 valid and 1 stale ID');
const mockCatalogue = [bikeA, bikeB, bikeC];
const resolved = machineWithStale.resolveCatalogue(mockCatalogue);
assert(resolved.length === 1 && resolved[0]._id === 'bike_001', 'Catalogue resolution drops stale ID deleted_bike_999');
assert(machineWithStale.count === 1, 'compareCount updated to 1 after stale ID pruning');
assert(machineWithStale.isInCompare('deleted_bike_999') === false, 'Stale ID purged from compare state');
const prunedStorage = JSON.parse(machineWithStale.storage.hero_compare_bike_ids);
assert(prunedStorage.length === 1 && prunedStorage[0] === 'bike_001', 'LocalStorage updated without stale ID');

// Test: Clear All
machine.clearCompare();
assert(machine.count === 0, 'compareCount === 0 after clearCompare()');
assert(machine.canCompare === false, 'canCompare === false after clearCompare()');
assert(machine.isFull === false, 'isFull === false after clearCompare()');
assert(machine.storage.hero_compare_bike_ids === undefined, 'LocalStorage key removed after clearCompare()');

// ============================================================
// 6. Security & Hygiene Audit
// ============================================================
console.log('\n6. Auditing Security & Hygiene:');

const compareFiles = [contextPath, btnPath, itemPath, barPath, emptyPath, comparePagePath];
let noSecrets = true;

for (const f of compareFiles) {
  if (fileContains(f, 'JWT_SECRET')) noSecrets = false;
  if (fileContains(f, 'MONGODB_URI')) noSecrets = false;
  if (fileContains(f, 'passwordHash')) noSecrets = false;
  if (fileContains(f, 'emiCalculator') || fileContains(f, 'fakeEmi')) noSecrets = false;
}
assert(noSecrets, 'Zero sensitive credentials, secrets, or fake EMI calculations found');

// ============================================================
// Summary
// ============================================================
console.log('\n================================================================');
console.log(` AUDIT COMPLETE: ${passed}/${total} assertions passed (${failed} failed)`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
