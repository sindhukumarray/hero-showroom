import React, { useState, useEffect, useId } from 'react';
import {
  Calculator,
  Percent,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Info,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  calculateEmi,
  DEFAULT_ANNUAL_INTEREST_RATE,
  DEFAULT_TENURE_MONTHS,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  TENURE_OPTIONS
} from '../../utils/emiCalculator';
import { formatCurrency } from '../../utils/formatters';
import Button from '../Button';
import Badge from '../Badge';
import Card from '../Card';

/**
 * EmiCalculator Component
 * Interactive vehicle loan calculator with reducing-balance EMI formulation,
 * live slider feedback, quick tenure selectors, and transparent financial breakdown.
 */
const EmiCalculator = ({
  initialPrice = 100000,
  bikeName = '',
  compact = false,
  className = '',
  onCalculate
}) => {
  const priceId = useId();
  const dpId = useId();
  const rateId = useId();
  const tenureId = useId();

  // State management
  const basePrice = Math.max(0, Math.round(Number(initialPrice) || 100000));
  const [vehiclePrice, setVehiclePrice] = useState(basePrice);
  const [downPayment, setDownPayment] = useState(
    Math.round((basePrice * DEFAULT_DOWN_PAYMENT_PERCENT) / 100)
  );
  const [interestRate, setInterestRate] = useState(DEFAULT_ANNUAL_INTEREST_RATE);
  const [tenureMonths, setTenureMonths] = useState(DEFAULT_TENURE_MONTHS);

  // Sync state if initialPrice prop changes (e.g. user toggles bike variant)
  useEffect(() => {
    const newPrice = Math.max(0, Math.round(Number(initialPrice) || 100000));
    setVehiclePrice(newPrice);
    setDownPayment(Math.round((newPrice * DEFAULT_DOWN_PAYMENT_PERCENT) / 100));
  }, [initialPrice]);

  // Live calculation
  const emiResult = calculateEmi({
    vehiclePrice,
    downPayment,
    annualInterestRate: interestRate,
    tenureMonths
  });

  // Notify parent if callback provided
  useEffect(() => {
    if (onCalculate && emiResult.isValid) {
      onCalculate(emiResult);
    }
  }, [emiResult, onCalculate]);

  // Helper actions
  const setDpByPercent = (percent) => {
    const val = Math.round((vehiclePrice * percent) / 100);
    setDownPayment(val);
  };

  const handleReset = () => {
    setVehiclePrice(basePrice);
    setDownPayment(Math.round((basePrice * DEFAULT_DOWN_PAYMENT_PERCENT) / 100));
    setInterestRate(DEFAULT_ANNUAL_INTEREST_RATE);
    setTenureMonths(DEFAULT_TENURE_MONTHS);
  };

  const downPaymentPercent = vehiclePrice > 0
    ? Math.min(100, Math.max(0, Math.round((downPayment / vehiclePrice) * 100)))
    : 0;

  return (
    <div
      className={`glass-surface rounded-card-lg border border-border/80 overflow-hidden shadow-card ${
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8 md:p-10'
      } ${className}`}
      role="region"
      aria-label="Vehicle EMI Calculator"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Calculator className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-surface-50">
              Vehicle Finance & EMI Calculator
            </h3>
          </div>
          {bikeName && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Estimated financing for <strong className="text-surface-100">{bikeName}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" size="sm" className="text-[11px] text-muted-foreground">
            Reducing Balance Formula
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
            className="text-xs py-1 px-2.5 text-muted-foreground hover:text-surface-50"
            title="Reset to default terms"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Column: Sliders & Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Vehicle Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={priceId} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vehicle Price (Ex-Showroom)
              </label>
              <span className="font-display font-bold text-base text-surface-50">
                {formatCurrency(vehiclePrice)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                ₹
              </span>
              <input
                id={priceId}
                type="number"
                min="10000"
                max="5000000"
                step="1000"
                value={vehiclePrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVehiclePrice(val);
                  if (downPayment > val) setDownPayment(val);
                }}
                className="w-full bg-surface-900 border border-border/80 focus:border-brand-red rounded-lg pl-8 pr-4 py-2.5 text-sm font-semibold text-surface-100 outline-none transition-colors"
                aria-describedby={emiResult.errors?.vehiclePrice ? `${priceId}-error` : undefined}
              />
            </div>
            {emiResult.errors?.vehiclePrice && (
              <p id={`${priceId}-error`} className="text-xs text-rose-400 font-medium">
                {emiResult.errors.vehiclePrice}
              </p>
            )}
          </div>

          {/* 2. Down Payment */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor={dpId} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Down Payment ({downPaymentPercent}%)
              </label>
              <span className="font-display font-bold text-base text-surface-50">
                {formatCurrency(downPayment)}
              </span>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDpByPercent(pct)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                    downPaymentPercent === pct
                      ? 'bg-brand-red text-white border-brand-red shadow-sm'
                      : 'bg-surface-900/60 text-muted-foreground border-border/80 hover:text-surface-50 hover:border-brand-red/40'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDownPayment(vehiclePrice)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  downPayment === vehiclePrice && vehiclePrice > 0
                    ? 'bg-brand-red text-white border-brand-red shadow-sm'
                    : 'bg-surface-900/60 text-muted-foreground border-border/80 hover:text-surface-50 hover:border-brand-red/40'
                }`}
              >
                100% (No Loan)
              </button>
            </div>

            {/* Range Slider */}
            <input
              id={dpId}
              type="range"
              min="0"
              max={vehiclePrice || 100000}
              step="1000"
              value={Math.min(downPayment, vehiclePrice)}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-brand-red cursor-pointer h-2 bg-surface-800 rounded-lg appearance-none"
              aria-label="Adjust down payment amount"
            />

            {emiResult.errors?.downPayment && (
              <p className="text-xs text-rose-400 font-medium">
                {emiResult.errors.downPayment}
              </p>
            )}
          </div>

          {/* 3. Interest Rate */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor={rateId} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Annual Interest Rate (% p.a.)
              </label>
              <span className="font-display font-bold text-base text-surface-50">
                {interestRate}%
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {[0, 7.5, 8.5, 10.5, 12.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setInterestRate(rate)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                    interestRate === rate
                      ? 'bg-brand-red text-white border-brand-red shadow-sm'
                      : 'bg-surface-900/60 text-muted-foreground border-border/80 hover:text-surface-50 hover:border-brand-red/40'
                  }`}
                >
                  {rate === 0 ? '0% Zero Interest' : `${rate}%`}
                </button>
              ))}
            </div>

            {/* Range Slider */}
            <input
              id={rateId}
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-brand-red cursor-pointer h-2 bg-surface-800 rounded-lg appearance-none"
              aria-label="Adjust interest rate"
            />

            {emiResult.errors?.annualInterestRate && (
              <p className="text-xs text-rose-400 font-medium">
                {emiResult.errors.annualInterestRate}
              </p>
            )}
          </div>

          {/* 4. Loan Tenure */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor={tenureId} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Loan Tenure ({tenureMonths} Months / {(tenureMonths / 12).toFixed(1)} Yrs)
              </label>
              <span className="font-display font-bold text-base text-surface-50">
                {tenureMonths} Months
              </span>
            </div>

            {/* Quick Tenure Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TENURE_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setTenureMonths(opt.months)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    tenureMonths === opt.months
                      ? 'bg-brand-red text-white border-brand-red shadow-sm font-bold'
                      : 'bg-surface-900/60 text-surface-200 border-border/80 hover:text-surface-50 hover:bg-surface-800'
                  }`}
                >
                  {opt.months} Mo
                </button>
              ))}
            </div>

            {/* Range Slider */}
            <input
              id={tenureId}
              type="range"
              min="6"
              max="60"
              step="6"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full accent-brand-red cursor-pointer h-2 bg-surface-800 rounded-lg appearance-none"
              aria-label="Adjust loan tenure in months"
            />

            {emiResult.errors?.tenureMonths && (
              <p className="text-xs text-rose-400 font-medium">
                {emiResult.errors.tenureMonths}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculated Breakdown & Summary Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-surface-900/90 border border-border rounded-card-lg p-6 space-y-6 shadow-inner">
            {/* Primary Result: Monthly EMI */}
            <div className="space-y-1.5 text-center pb-5 border-b border-border/60">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Estimated Monthly EMI
              </span>
              <div className="font-display font-black text-3xl sm:text-4xl text-surface-50 text-brand-red">
                {formatCurrency(emiResult.monthlyEmi)}
                <span className="text-xs font-medium text-muted-foreground ml-1.5">/ month</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                For {tenureMonths} months @ {interestRate}% p.a.
              </p>
            </div>

            {/* Financial Parameters Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-surface-200">
                <span className="text-muted-foreground">Principal Loan Amount</span>
                <span className="font-bold text-surface-50">{formatCurrency(emiResult.loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-surface-200">
                <span className="text-muted-foreground">Upfront Down Payment</span>
                <span className="font-medium text-surface-100">{formatCurrency(emiResult.downPayment)}</span>
              </div>
              <div className="flex items-center justify-between text-surface-200">
                <span className="text-muted-foreground">Total Interest Payable</span>
                <span className="font-medium text-surface-100">{formatCurrency(emiResult.totalInterest)}</span>
              </div>
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-surface-50 font-bold">
                <span>Total Amount Payable (Loan)</span>
                <span className="font-display font-bold text-base text-surface-50">
                  {formatCurrency(emiResult.totalAmountPayable)}
                </span>
              </div>
            </div>

            {/* Principal vs Interest Share Bar */}
            {emiResult.totalAmountPayable > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-100 inline-block" /> Principal ({emiResult.principalPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-red inline-block" /> Interest ({emiResult.interestPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-800 overflow-hidden flex">
                  <div
                    className="bg-surface-200 transition-all duration-300"
                    style={{ width: `${emiResult.principalPercent}%` }}
                    aria-hidden="true"
                  />
                  <div
                    className="bg-brand-red transition-all duration-300"
                    style={{ width: `${emiResult.interestPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Legal / Financial Safety Disclaimer */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-card bg-surface-900/50 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 text-brand-red shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="text-surface-200">Indicative Estimate:</strong> Loan terms, interest rates, processing fees, documentation, and customer eligibility are subject to credit assessment and individual lender policies. This calculator does not constitute a formal loan sanction or approval.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmiCalculator;
