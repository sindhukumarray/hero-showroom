/**
 * Formats an amount as Indian Rupee currency.
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formats amount into Lakhs notation if >= 1,00,000.
 * @param {number} amount
 * @returns {string}
 */
export const formatPriceLakhs = (amount) => {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 100000) {
    const inLakhs = (amount / 100000).toFixed(2);
    return `₹${parseFloat(inLakhs)} Lakh`;
  }
  return formatCurrency(amount);
};

/**
 * Formats a minPrice and maxPrice into an ex-showroom range string.
 * @param {number} minPrice
 * @param {number} maxPrice
 * @returns {string}
 */
export const formatPriceRange = (minPrice, maxPrice) => {
  if (!minPrice && !maxPrice) return 'Price on Request';
  if (minPrice === maxPrice) return formatCurrency(minPrice);
  return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
};
