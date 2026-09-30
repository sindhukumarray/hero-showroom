/**
 * HERO SHOWROOM — EMI & Vehicle Finance Calculator Utility
 * Implements standard reducing-balance loan calculations with complete edge-case handling.
 */

export const DEFAULT_ANNUAL_INTEREST_RATE = 8.5; // Typical 2-wheeler loan rate in India (8.5% - 12%)
export const DEFAULT_TENURE_MONTHS = 36; // 3 years standard tenure
export const DEFAULT_DOWN_PAYMENT_PERCENT = 20; // 20% standard down payment

export const TENURE_OPTIONS = [
  { months: 12, label: '12 Months (1 Yr)' },
  { months: 24, label: '24 Months (2 Yrs)' },
  { months: 36, label: '36 Months (3 Yrs)' },
  { months: 48, label: '48 Months (4 Yrs)' },
  { months: 60, label: '60 Months (5 Yrs)' }
];

/**
 * Validates financial inputs for vehicle EMI calculation.
 * @param {object} params
 * @param {number} params.vehiclePrice
 * @param {number} params.downPayment
 * @param {number} params.annualInterestRate
 * @param {number} params.tenureMonths
 * @returns {{ isValid: boolean, errors: object }}
 */
export const validateEmiInputs = ({
  vehiclePrice,
  downPayment = 0,
  annualInterestRate = DEFAULT_ANNUAL_INTEREST_RATE,
  tenureMonths = DEFAULT_TENURE_MONTHS
} = {}) => {
  const errors = {};

  const priceNum = Number(vehiclePrice);
  const dpNum = Number(downPayment);
  const rateNum = Number(annualInterestRate);
  const tenureNum = Number(tenureMonths);

  // Vehicle Price Validation
  if (vehiclePrice === undefined || vehiclePrice === null || vehiclePrice === '' || isNaN(priceNum)) {
    errors.vehiclePrice = 'Vehicle price must be a valid number.';
  } else if (!isFinite(priceNum) || priceNum <= 0) {
    errors.vehiclePrice = 'Vehicle price must be greater than ₹0.';
  }

  // Down Payment Validation
  if (downPayment === undefined || downPayment === null || downPayment === '' || isNaN(dpNum)) {
    errors.downPayment = 'Down payment must be a valid number.';
  } else if (!isFinite(dpNum) || dpNum < 0) {
    errors.downPayment = 'Down payment cannot be negative.';
  } else if (!isNaN(priceNum) && priceNum > 0 && dpNum > priceNum) {
    errors.downPayment = 'Down payment cannot exceed the vehicle price.';
  }

  // Annual Interest Rate Validation
  if (annualInterestRate === undefined || annualInterestRate === null || annualInterestRate === '' || isNaN(rateNum)) {
    errors.annualInterestRate = 'Interest rate must be a valid number.';
  } else if (!isFinite(rateNum) || rateNum < 0) {
    errors.annualInterestRate = 'Interest rate cannot be negative.';
  } else if (rateNum > 50) {
    errors.annualInterestRate = 'Interest rate cannot exceed 50% p.a.';
  }

  // Tenure Validation
  if (tenureMonths === undefined || tenureMonths === null || tenureMonths === '' || isNaN(tenureNum)) {
    errors.tenureMonths = 'Loan tenure must be a valid number of months.';
  } else if (!isFinite(tenureNum) || !Number.isInteger(tenureNum) || tenureNum <= 0) {
    errors.tenureMonths = 'Loan tenure must be a positive integer greater than 0.';
  } else if (tenureNum > 120) {
    errors.tenureMonths = 'Loan tenure cannot exceed 120 months (10 years).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Calculates monthly EMI, total interest, and total payable amount
 * using the standard reducing balance loan formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * @param {object} params
 * @param {number} params.vehiclePrice
 * @param {number} [params.downPayment=0]
 * @param {number} [params.annualInterestRate=DEFAULT_ANNUAL_INTEREST_RATE]
 * @param {number} [params.tenureMonths=DEFAULT_TENURE_MONTHS]
 * @returns {object} Calculated financial breakdown
 */
export const calculateEmi = ({
  vehiclePrice,
  downPayment = 0,
  annualInterestRate = DEFAULT_ANNUAL_INTEREST_RATE,
  tenureMonths = DEFAULT_TENURE_MONTHS
} = {}) => {
  const validation = validateEmiInputs({
    vehiclePrice,
    downPayment,
    annualInterestRate,
    tenureMonths
  });

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors,
      vehiclePrice: Number(vehiclePrice) || 0,
      downPayment: Number(downPayment) || 0,
      loanAmount: 0,
      annualInterestRate: Number(annualInterestRate) || 0,
      tenureMonths: Number(tenureMonths) || 0,
      monthlyEmi: 0,
      totalInterest: 0,
      totalAmountPayable: 0,
      principalPercent: 0,
      interestPercent: 0
    };
  }

  const price = Math.round(Number(vehiclePrice));
  const dp = Math.round(Number(downPayment));
  const annualRate = Number(annualInterestRate);
  const tenure = Math.round(Number(tenureMonths));

  const loanAmount = Math.max(0, price - dp);

  // Scenario 1: Loan amount is 0 (Full down payment)
  if (loanAmount === 0) {
    return {
      isValid: true,
      errors: {},
      vehiclePrice: price,
      downPayment: dp,
      loanAmount: 0,
      annualInterestRate: annualRate,
      tenureMonths: tenure,
      monthlyEmi: 0,
      totalInterest: 0,
      totalAmountPayable: 0,
      principalPercent: 100,
      interestPercent: 0
    };
  }

  // Scenario 2: Zero-Interest Loan (0% scheme)
  if (annualRate === 0) {
    const zeroEmi = Math.round(loanAmount / tenure);
    const totalPayable = zeroEmi * tenure;

    return {
      isValid: true,
      errors: {},
      vehiclePrice: price,
      downPayment: dp,
      loanAmount,
      annualInterestRate: 0,
      tenureMonths: tenure,
      monthlyEmi: zeroEmi,
      totalInterest: 0,
      totalAmountPayable: totalPayable,
      principalPercent: 100,
      interestPercent: 0
    };
  }

  // Scenario 3: Standard Positive Reducing-Balance Interest Rate
  const monthlyRate = annualRate / (12 * 100);
  const rateFactor = Math.pow(1 + monthlyRate, tenure);

  // Safeguard against arithmetic edge cases
  if (!isFinite(rateFactor) || rateFactor === 1) {
    const fallbackEmi = Math.round(loanAmount / tenure);
    return {
      isValid: true,
      errors: {},
      vehiclePrice: price,
      downPayment: dp,
      loanAmount,
      annualInterestRate: annualRate,
      tenureMonths: tenure,
      monthlyEmi: fallbackEmi,
      totalInterest: 0,
      totalAmountPayable: fallbackEmi * tenure,
      principalPercent: 100,
      interestPercent: 0
    };
  }

  const rawEmi = (loanAmount * monthlyRate * rateFactor) / (rateFactor - 1);
  const monthlyEmi = Math.round(rawEmi);
  const totalAmountPayable = monthlyEmi * tenure;
  const totalInterest = Math.max(0, totalAmountPayable - loanAmount);

  const principalPercent = totalAmountPayable > 0
    ? Math.round((loanAmount / totalAmountPayable) * 100)
    : 100;
  const interestPercent = Math.max(0, 100 - principalPercent);

  return {
    isValid: true,
    errors: {},
    vehiclePrice: price,
    downPayment: dp,
    loanAmount,
    annualInterestRate: annualRate,
    tenureMonths: tenure,
    monthlyEmi,
    totalInterest,
    totalAmountPayable,
    principalPercent,
    interestPercent
  };
};

export default {
  calculateEmi,
  validateEmiInputs,
  DEFAULT_ANNUAL_INTEREST_RATE,
  DEFAULT_TENURE_MONTHS,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  TENURE_OPTIONS
};
