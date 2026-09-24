/**
 * User Role Constants
 * Defines supported user privilege levels across the platform.
 */
const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  ADMIN: 'admin'
});

const ALLOWED_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ALLOWED_ROLES
};
