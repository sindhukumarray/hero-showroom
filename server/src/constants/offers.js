/**
 * Offer Constants
 * Defines supported offer categories/types and validation enums.
 */
const OFFER_TYPES = Object.freeze({
  DISCOUNT: 'discount',
  CASHBACK: 'cashback',
  EXCHANGE: 'exchange',
  ACCESSORIES: 'accessories',
  SERVICE: 'service',
  SPECIAL: 'special'
});

const ALLOWED_OFFER_TYPES = Object.freeze(Object.values(OFFER_TYPES));

module.exports = {
  OFFER_TYPES,
  ALLOWED_OFFER_TYPES
};
