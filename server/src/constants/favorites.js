/**
 * Favorites Constants
 * Defines the valid entity types that a customer may favorite.
 */
const FAVORITE_TYPES = Object.freeze({
  BIKE: 'bike',
  SHOWROOM: 'showroom'
});

const ALLOWED_FAVORITE_TYPES = Object.freeze(Object.values(FAVORITE_TYPES));

module.exports = {
  FAVORITE_TYPES,
  ALLOWED_FAVORITE_TYPES
};
