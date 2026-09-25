/**
 * Review Constants
 * Defines moderation status lifecycle and rating bounds for customer showroom reviews.
 */
const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
});

const ALLOWED_REVIEW_STATUS = Object.freeze(Object.values(REVIEW_STATUS));

const REVIEW_RATING = Object.freeze({
  MIN: 1,
  MAX: 5
});

module.exports = {
  REVIEW_STATUS,
  ALLOWED_REVIEW_STATUS,
  REVIEW_RATING
};
