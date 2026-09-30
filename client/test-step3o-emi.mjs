/**
 * HERO SHOWROOM — Phase 3 Step 15 EMI & Finance Foundation Test Suite
 * Comprehensive automated verification for mathematical calculations,
 * boundary conditions, edge cases, component structure, page integrations, and safety.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  calculateEmi,
  validateEmiInputs,
  DEFAULT_ANNUAL_INTEREST_RATE,
  DEFAULT_TENURE_MONTHS,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  TENURE_OPTIONS
} from './src/utils/emiCalculator.js';
import { formatCurrency, formatPriceRange } from './src/utils/formatters.js';

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
console.log(' HERO SHOWROOM — PHASE 3 STEP 15 EMI & FINANCE AUDIT & TESTS    ');
console.log('================================================================\n');

// ============================================================
// 1. Pure Mathematical & Functional Verification of calculateEmi
// ============================================================
console.log('1. Mathematical EMI Calculation Correctness:');

// Scenario 1: Known standard 10% 12-month loan
// P = 80,000, r = 10/(12*100), n = 12
// Exact: 80000 * (10/1200) * (1+10/1200)^12 / ((1+10/1200)^12 - 1) = 7033.27 -> 7033
const std1 = calculateEmi({
  vehiclePrice: 100000,
  downPayment: 20000,
  annualInterestRate: 10,
  tenureMonths: 12
});
assert(std1.isValid === true, 'Standard 10% 12-month loan inputs are valid');
assert(std1.loanAmount === 80000, 'Loan amount is correctly ₹80,000 (100k - 20k)');
assert(std1.monthlyEmi === 7033, `Standard EMI is exactly ₹7,033 (got ${std1.monthlyEmi})`);
assert(std1.totalAmountPayable === 7033 * 12, 'Total amount payable equals EMI * 12 (₹84,396)');
assert(std1.totalInterest === (7033 * 12) - 80000, 'Total interest equals Total Payable - Principal (₹4,396)');
assert(std1.totalInterest > 0, 'Total interest is positive for 10% loan');
assert(Number.isFinite(std1.monthlyEmi), 'Monthly EMI is finite');

// Scenario 2: Standard 36-month loan at 8.5%
// P = 1,60,000, r = 8.5/1200, n = 36
const std2 = calculateEmi({
  vehiclePrice: 200000,
  downPayment: 40000,
  annualInterestRate: 8.5,
  tenureMonths: 36
});
assert(std2.isValid === true, '36-month 8.5% loan inputs are valid');
assert(std2.loanAmount === 160000, 'Loan amount is ₹1,60,000');
assert(std2.monthlyEmi === 5051, `36-month 8.5% EMI is ₹5,051 (got ${std2.monthlyEmi})`);
assert(std2.totalAmountPayable === 5051 * 36, 'Total payable is correctly ₹1,81,836');
assert(std2.totalInterest === (5051 * 36) - 160000, 'Total interest is ₹21,836');

// Scenario 3: Zero-interest loan (0% promotional scheme)
const zeroInterest = calculateEmi({
  vehiclePrice: 60000,
  downPayment: 12000,
  annualInterestRate: 0,
  tenureMonths: 24
});
assert(zeroInterest.isValid === true, '0% loan inputs are valid');
assert(zeroInterest.loanAmount === 48000, 'Zero-interest loan amount is ₹48,000');
assert(zeroInterest.monthlyEmi === 2000, 'Zero-interest EMI is exactly ₹2,000 (48000 / 24)');
assert(zeroInterest.totalInterest === 0, 'Zero-interest loan has ₹0 total interest');
assert(zeroInterest.totalAmountPayable === 48000, 'Zero-interest total payable equals principal');

// Scenario 4: Small loan
const smallLoan = calculateEmi({
  vehiclePrice: 30000,
  downPayment: 10000,
  annualInterestRate: 9,
  tenureMonths: 6
});
assert(smallLoan.isValid === true, 'Small loan is valid');
assert(smallLoan.monthlyEmi === 3421, `Small loan EMI is ₹3,421 (got ${smallLoan.monthlyEmi})`);
assert(smallLoan.totalInterest > 0, 'Small loan total interest is non-negative');

// Scenario 5: Large loan
const largeLoan = calculateEmi({
  vehiclePrice: 500000,
  downPayment: 100000,
  annualInterestRate: 11.5,
  tenureMonths: 60
});
assert(largeLoan.isValid === true, 'Large loan is valid');
assert(largeLoan.loanAmount === 400000, 'Large loan principal is ₹4,00,000');
assert(largeLoan.monthlyEmi === 8797, `Large loan EMI is ₹8,797 (got ${largeLoan.monthlyEmi})`);
assert(largeLoan.totalAmountPayable === 8797 * 60, 'Large loan total payable is correct (₹5,27,820)');


// ============================================================
// 2. Boundary Cases & Input Validation Constraints
// ============================================================
console.log('\n2. Boundary Conditions & Input Validation:');

// Scenario 6: Full down payment (100% down payment -> loan amount 0)
const fullDp = calculateEmi({
  vehiclePrice: 150000,
  downPayment: 150000,
  annualInterestRate: 10,
  tenureMonths: 36
});
assert(fullDp.isValid === true, 'Full down payment is valid');
assert(fullDp.loanAmount === 0, 'Full down payment produces loanAmount = 0');
assert(fullDp.monthlyEmi === 0, 'Full down payment produces monthlyEmi = 0');
assert(fullDp.totalInterest === 0, 'Full down payment produces totalInterest = 0');
assert(fullDp.totalAmountPayable === 0, 'Full down payment produces totalAmountPayable = 0');

// Scenario 7: Down payment cannot exceed vehicle price
const excessDp = calculateEmi({
  vehiclePrice: 100000,
  downPayment: 120000,
  annualInterestRate: 10,
  tenureMonths: 24
});
assert(excessDp.isValid === false, 'Down payment exceeding vehicle price is rejected');
assert(excessDp.errors?.downPayment !== undefined, 'Down payment exceeding vehicle price provides clear error');
assert(excessDp.monthlyEmi === 0, 'Invalid down payment yields 0 EMI safely');

// Scenario 8: Negative down payment rejected
const negDp = calculateEmi({
  vehiclePrice: 100000,
  downPayment: -5000,
  annualInterestRate: 8.5,
  tenureMonths: 36
});
assert(negDp.isValid === false, 'Negative down payment is rejected');
assert(negDp.errors?.downPayment !== undefined, 'Negative down payment provides clear error');

// Scenario 9: Negative interest rate rejected
const negRate = calculateEmi({
  vehiclePrice: 100000,
  downPayment: 20000,
  annualInterestRate: -2,
  tenureMonths: 36
});
assert(negRate.isValid === false, 'Negative interest rate is rejected');
assert(negRate.errors?.annualInterestRate !== undefined, 'Negative interest rate provides clear error');

// Scenario 10: Zero tenure rejected
const zeroTenure = calculateEmi({
  vehiclePrice: 100000,
  downPayment: 20000,
  annualInterestRate: 8.5,
  tenureMonths: 0
});
assert(zeroTenure.isValid === false, 'Zero tenure is rejected');
assert(zeroTenure.errors?.tenureMonths !== undefined, 'Zero tenure provides clear error');

// Scenario 11: Negative tenure rejected
const negTenure = calculateEmi({
  vehiclePrice: 100000,
  downPayment: 20000,
  annualInterestRate: 8.5,
  tenureMonths: -12
});
assert(negTenure.isValid === false, 'Negative tenure is rejected');
assert(negTenure.errors?.tenureMonths !== undefined, 'Negative tenure provides clear error');

// Scenario 12: Zero/negative vehicle price rejected
const zeroPrice = calculateEmi({
  vehiclePrice: 0,
  downPayment: 0,
  annualInterestRate: 8.5,
  tenureMonths: 36
});
assert(zeroPrice.isValid === false, 'Zero vehicle price is rejected');
assert(zeroPrice.errors?.vehiclePrice !== undefined, 'Zero vehicle price provides clear error');

// Scenario 13: Non-numeric / NaN values handled safely
const nanInputs = calculateEmi({
  vehiclePrice: 'abc',
  downPayment: 'invalid',
  annualInterestRate: undefined,
  tenureMonths: null
});
assert(nanInputs.isValid === false, 'Non-numeric inputs are safely handled as invalid');
assert(!isNaN(nanInputs.monthlyEmi), 'Monthly EMI does not become NaN on invalid inputs');
assert(nanInputs.monthlyEmi === 0, 'Monthly EMI defaults safely to 0 on invalid inputs');

// Scenario 14: Percentage breakdown consistency
const pctCheck = calculateEmi({
  vehiclePrice: 120000,
  downPayment: 24000,
  annualInterestRate: 9.5,
  tenureMonths: 36
});
assert(pctCheck.principalPercent + pctCheck.interestPercent === 100, 'Principal + Interest percentage equals 100%');

// ============================================================
// 3. Currency Formatting Verification
// ============================================================
console.log('\n3. Verifying Currency Formatting:');

assert(formatCurrency(0).includes('0'), 'formatCurrency(0) handles 0');
assert(formatCurrency(7034).includes('7,034') || formatCurrency(7034).includes('7034'), 'formatCurrency formats ₹7,034');
assert(formatCurrency(150000).includes('1,50,000') || formatCurrency(150000).includes('150000'), 'formatCurrency formats Lakh correctly');
assert(formatPriceRange(60000, 80000).includes('–'), 'formatPriceRange generates range string');

// ============================================================
// 4. Component & Integration Static Audits
// ============================================================
console.log('\n4. Component & Integration Audits:');

const utilPath = path.join(CLIENT_SRC, 'utils', 'emiCalculator.js');
assert(fileExists(utilPath), 'client/src/utils/emiCalculator.js exists');
assert(fileContains(utilPath, 'calculateEmi'), 'emiCalculator.js exports calculateEmi');
assert(fileContains(utilPath, 'validateEmiInputs'), 'emiCalculator.js exports validateEmiInputs');

const compPath = path.join(CLIENT_SRC, 'components', 'finance', 'EmiCalculator.jsx');
assert(fileExists(compPath), 'client/src/components/finance/EmiCalculator.jsx exists');
assert(fileContains(compPath, 'calculateEmi'), 'EmiCalculator consumes calculateEmi');
assert(fileContains(compPath, 'formatCurrency'), 'EmiCalculator uses formatCurrency');
assert(fileContains(compPath, 'Estimated Monthly EMI'), 'EmiCalculator displays Estimated Monthly EMI label');
assert(fileContains(compPath, 'Principal Loan Amount'), 'EmiCalculator displays Principal Loan Amount');
assert(fileContains(compPath, 'Total Interest Payable'), 'EmiCalculator displays Total Interest Payable');
assert(fileContains(compPath, 'Total Amount Payable'), 'EmiCalculator displays Total Amount Payable');
assert(fileContains(compPath, 'Indicative Estimate'), 'EmiCalculator displays legal indicative disclaimer');

const financeIndex = path.join(CLIENT_SRC, 'components', 'finance', 'index.js');
assert(fileExists(financeIndex), 'components/finance/index.js barrel exists');
assert(fileContains(financeIndex, 'EmiCalculator'), 'components/finance/index.js exports EmiCalculator');

const compIndex = path.join(CLIENT_SRC, 'components', 'index.js');
assert(fileContains(compIndex, 'EmiCalculator'), 'components/index.js exports EmiCalculator');

// BikeDetailPage integration
const bikeDetailPath = path.join(CLIENT_SRC, 'pages', 'BikeDetailPage.jsx');
assert(fileContains(bikeDetailPath, 'EmiCalculator'), 'BikeDetailPage imports EmiCalculator');
assert(fileContains(bikeDetailPath, 'calculateEmi'), 'BikeDetailPage imports calculateEmi');
assert(fileContains(bikeDetailPath, 'id="emi-calculator"'), 'BikeDetailPage renders #emi-calculator section');
assert(fileContains(bikeDetailPath, 'Finance & EMI Estimator'), 'BikeDetailPage renders Finance & EMI Estimator header');
assert(fileContains(bikeDetailPath, 'EMI from'), 'BikeDetailPage pricing box displays quick EMI indicator');

// ComparePage integration
const comparePagePath = path.join(CLIENT_SRC, 'pages', 'ComparePage.jsx');
assert(fileContains(comparePagePath, 'EmiCalculator'), 'ComparePage imports EmiCalculator');
assert(fileContains(comparePagePath, 'calculateEmi'), 'ComparePage imports calculateEmi');
assert(fileContains(comparePagePath, 'Estimated EMI'), 'ComparePage includes EMI in specifications matrix');
assert(fileContains(comparePagePath, 'Calculate EMI'), 'ComparePage provides Calculate EMI entry point');
assert(fileContains(comparePagePath, 'Modal'), 'ComparePage opens interactive EMI modal');

// ============================================================
// 5. Security & Financial UX Safety Audit
// ============================================================
console.log('\n5. Security & Financial UX Safety:');

const financeFiles = [utilPath, compPath, bikeDetailPath, comparePagePath];
let noSensitiveFields = true;
let noGuaranteedClaims = true;

for (const f of financeFiles) {
  if (fileContains(f, 'panNumber') || fileContains(f, 'aadhaar') || fileContains(f, 'bankAccount') || fileContains(f, 'creditCard')) {
    noSensitiveFields = false;
  }
  if (fileContains(f, 'Guaranteed Loan') || fileContains(f, '100% Approved Loan')) {
    noGuaranteedClaims = false;
  }
}

assert(noSensitiveFields, 'Zero sensitive financial credentials (PAN, Aadhaar, Bank Details) requested');
assert(noGuaranteedClaims, 'Zero misleading or guaranteed loan approval claims present');

// ============================================================
// Summary
// ============================================================
console.log('\n================================================================');
console.log(` AUDIT COMPLETE: ${passed}/${total} assertions passed (${failed} failed)`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
