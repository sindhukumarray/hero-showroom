const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const adminController = require('../controllers/adminController');
const adminBrandController = require('../controllers/adminBrandController');
const adminCityController = require('../controllers/adminCityController');
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

module.exports = router;
