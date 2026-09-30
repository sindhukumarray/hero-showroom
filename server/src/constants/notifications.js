/**
 * Notification Constants
 * Defines notification types supported across the customer notification foundation.
 */
const NOTIFICATION_TYPES = Object.freeze({
  LEAD: 'LEAD',
  TEST_RIDE: 'TEST_RIDE',
  OFFER: 'OFFER',
  REVIEW: 'REVIEW',
  SYSTEM: 'SYSTEM'
});

const ALLOWED_NOTIFICATION_TYPES = Object.freeze(Object.values(NOTIFICATION_TYPES));

module.exports = {
  NOTIFICATION_TYPES,
  ALLOWED_NOTIFICATION_TYPES
};
