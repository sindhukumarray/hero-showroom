/**
 * Test Ride Constants
 * Defines status lifecycles for test ride bookings.
 */
const TEST_RIDE_STATUS = Object.freeze({
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const ALLOWED_TEST_RIDE_STATUS = Object.freeze(Object.values(TEST_RIDE_STATUS));

module.exports = {
  TEST_RIDE_STATUS,
  ALLOWED_TEST_RIDE_STATUS
};
