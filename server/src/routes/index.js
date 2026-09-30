const express = require('express');
const healthRoutes = require('./healthRoutes');
const brandRoutes = require('./brandRoutes');
const cityRoutes = require('./cityRoutes');
const showroomRoutes = require('./showroomRoutes');
const bikeRoutes = require('./bikeRoutes');
const authRoutes = require('./authRoutes');
const leadRoutes = require('./leadRoutes');
const testRideRoutes = require('./testRideRoutes');
const offerRoutes = require('./offerRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const reviewRoutes = require('./reviewRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/brands', brandRoutes);
router.use('/cities', cityRoutes);
router.use('/showrooms', showroomRoutes);
router.use('/bikes', bikeRoutes);
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/test-rides', testRideRoutes);
router.use('/offers', offerRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
