/**
 * Lead Constants
 * Defines status lifecycles and enquiry source tracking.
 */
const LEAD_STATUS = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  CLOSED: 'closed'
});

const ALLOWED_LEAD_STATUS = Object.freeze(Object.values(LEAD_STATUS));

const LEAD_SOURCES = Object.freeze({
  SHOWROOM: 'showroom',
  BIKE: 'bike',
  OFFER: 'offer',
  TEST_RIDE: 'test_ride'
});

const ALLOWED_LEAD_SOURCES = Object.freeze(Object.values(LEAD_SOURCES));

module.exports = {
  LEAD_STATUS,
  ALLOWED_LEAD_STATUS,
  LEAD_SOURCES,
  ALLOWED_LEAD_SOURCES
};
