const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const adminController = require('../controllers/adminController');
const adminBrandController = require('../controllers/adminBrandController');
const adminCityController = require('../controllers/adminCityController');
const adminShowroomController = require('../controllers/adminShowroomController');
const adminBikeController = require('../controllers/adminBikeController');
const adminBikeVariantController = require('../controllers/adminBikeVariantController');
const {
  validateBrandQuery,
  validateBrandId,
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandStatus
} = require('../validators/brandValidator');
const {
  validateCityQuery,
  validateCityId,
  validateCreateCity,
  validateUpdateCity,
  validateCityStatus
} = require('../validators/cityValidator');
const {
  validateAdminShowroomQuery,
  validateShowroomId,
  validateCreateShowroom,
  validateUpdateShowroom,
  validateShowroomStatus
} = require('../validators/showroomValidator');
const {
  validateAdminBikeQuery,
  validateBikeId,
  validateCreateBike,
  validateUpdateBike,
  validateBikeStatus
} = require('../validators/bikeValidator');
const {
  validateAdminBikeVariantQuery,
  validateBikeVariantParentId,
  validateVariantId,
  validateCreateBikeVariant,
  validateUpdateBikeVariant,
  validateBikeVariantStatus
} = require('../validators/bikeVariantValidator');

const router = express.Router();

/**
 * Admin Routes
 * Base: /api/admin
 * All routes mounted on this router require valid JWT and ADMIN role.
 */
router.use(verifyToken, requireRole(ROLES.ADMIN));

/**
 * ============================================================
 * 1. Admin System & Status Verification
 * ============================================================
 */
router.get('/status', adminController.getAdminStatus);

/**
 * ============================================================
 * 2. Admin Brand Catalogue Endpoints
 * Base: /api/admin/brands
 * ============================================================
 */
router.get('/brands', validateBrandQuery, adminBrandController.getBrands);
router.post('/brands', validateCreateBrand, adminBrandController.createBrand);
router.get('/brands/:id', validateBrandId, adminBrandController.getBrandById);
router.put('/brands/:id', validateBrandId, validateUpdateBrand, adminBrandController.updateBrand);
router.patch('/brands/:id/status', validateBrandId, validateBrandStatus, adminBrandController.updateBrandStatus);
router.delete('/brands/:id', validateBrandId, adminBrandController.deleteBrand);

/**
 * ============================================================
 * 3. Admin City Catalogue Endpoints
 * Base: /api/admin/cities
 * ============================================================
 */
router.get('/cities', validateCityQuery, adminCityController.getCities);
router.post('/cities', validateCreateCity, adminCityController.createCity);
router.get('/cities/:id', validateCityId, adminCityController.getCityById);
router.put('/cities/:id', validateCityId, validateUpdateCity, adminCityController.updateCity);
router.patch('/cities/:id/status', validateCityId, validateCityStatus, adminCityController.updateCityStatus);
router.delete('/cities/:id', validateCityId, adminCityController.deleteCity);

/**
 * ============================================================
 * 4. Admin Showroom Management Endpoints
 * Base: /api/admin/showrooms
 * ============================================================
 */
router.get('/showrooms', validateAdminShowroomQuery, adminShowroomController.getShowrooms);
router.post('/showrooms', validateCreateShowroom, adminShowroomController.createShowroom);
router.get('/showrooms/:id', validateShowroomId, adminShowroomController.getShowroomById);
router.put('/showrooms/:id', validateShowroomId, validateUpdateShowroom, adminShowroomController.updateShowroom);
router.patch('/showrooms/:id/status', validateShowroomId, validateShowroomStatus, adminShowroomController.updateShowroomStatus);
router.delete('/showrooms/:id', validateShowroomId, adminShowroomController.deleteShowroom);

/**
 * ============================================================
 * 5. Admin Bike Variant Sub-Resource Endpoints
 * Base: /api/admin/bikes/:bikeId/variants
 * ============================================================
 */
router.get('/bikes/:bikeId/variants', validateBikeVariantParentId, validateAdminBikeVariantQuery, adminBikeVariantController.getVariants);
router.post('/bikes/:bikeId/variants', validateBikeVariantParentId, validateCreateBikeVariant, adminBikeVariantController.createVariant);
router.get('/bikes/:bikeId/variants/:variantId', validateBikeVariantParentId, validateVariantId, adminBikeVariantController.getVariantById);
router.put('/bikes/:bikeId/variants/:variantId', validateBikeVariantParentId, validateVariantId, validateUpdateBikeVariant, adminBikeVariantController.updateVariant);
router.patch('/bikes/:bikeId/variants/:variantId/status', validateBikeVariantParentId, validateVariantId, validateBikeVariantStatus, adminBikeVariantController.updateVariantStatus);
router.delete('/bikes/:bikeId/variants/:variantId', validateBikeVariantParentId, validateVariantId, adminBikeVariantController.deleteVariant);

/**
 * ============================================================
 * 6. Admin Bike Catalogue Endpoints
 * Base: /api/admin/bikes
 * ============================================================
 */
router.get('/bikes', validateAdminBikeQuery, adminBikeController.getBikes);
router.post('/bikes', validateCreateBike, adminBikeController.createBike);
router.get('/bikes/:id', validateBikeId, adminBikeController.getBikeById);
router.put('/bikes/:id', validateBikeId, validateUpdateBike, adminBikeController.updateBike);
router.patch('/bikes/:id/status', validateBikeId, validateBikeStatus, adminBikeController.updateBikeStatus);
router.delete('/bikes/:id', validateBikeId, adminBikeController.deleteBike);

module.exports = router;
