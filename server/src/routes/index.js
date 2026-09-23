const express = require('express');
const healthRoutes = require('./healthRoutes');
const brandRoutes = require('./brandRoutes');
const cityRoutes = require('./cityRoutes');
const showroomRoutes = require('./showroomRoutes');
const bikeRoutes = require('./bikeRoutes');

const router = express.Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/brands', brandRoutes);
router.use('/cities', cityRoutes);
router.use('/showrooms', showroomRoutes);
router.use('/bikes', bikeRoutes);

module.exports = router;
