/**
 * Hero Showroom - Phase 2 Step 4 Integration Test Suite
 * Frontend Service Layer, Dynamic Pages & Real API Integration Audit
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server .env for live MongoDB testing if present
const serverEnvPath = path.resolve(__dirname, 'server/.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runStep4Audit() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 2 STEP 4 INTEGRATION AUDIT');
  console.log('=====================================================\n');

  // --- 1. Audit Frontend Service Layer Structure ---
  console.log('1. Auditing Frontend Service Layer Files & Exports:');
  const servicesDir = path.resolve(__dirname, 'client/src/services');
  assert(fs.existsSync(servicesDir), 'client/src/services directory exists');

  const brandServicePath = path.resolve(servicesDir, 'brandService.js');
  assert(fs.existsSync(brandServicePath), 'brandService.js exists');
  const brandContent = fs.readFileSync(brandServicePath, 'utf-8');
  assert(brandContent.includes('export const getBrands'), 'brandService exports getBrands');
  assert(brandContent.includes('export const getBrandBySlug'), 'brandService exports getBrandBySlug');

  const cityServicePath = path.resolve(servicesDir, 'cityService.js');
  assert(fs.existsSync(cityServicePath), 'cityService.js exists');
  const cityContent = fs.readFileSync(cityServicePath, 'utf-8');
  assert(cityContent.includes('export const getCities'), 'cityService exports getCities');
  assert(cityContent.includes('export const getCityBySlug'), 'cityService exports getCityBySlug');

  const showroomServicePath = path.resolve(servicesDir, 'showroomService.js');
  assert(fs.existsSync(showroomServicePath), 'showroomService.js exists');
  const showroomContent = fs.readFileSync(showroomServicePath, 'utf-8');
  assert(showroomContent.includes('export const getShowrooms'), 'showroomService exports getShowrooms');
  assert(showroomContent.includes('export const getShowroomBySlug'), 'showroomService exports getShowroomBySlug');
  assert(showroomContent.includes('export const getNearbyShowrooms'), 'showroomService exports getNearbyShowrooms');

  const bikeServicePath = path.resolve(servicesDir, 'bikeService.js');
  assert(fs.existsSync(bikeServicePath), 'bikeService.js exists');
  const bikeContent = fs.readFileSync(bikeServicePath, 'utf-8');
  assert(bikeContent.includes('export const getBikes'), 'bikeService exports getBikes');
  assert(bikeContent.includes('export const getBikeBySlug'), 'bikeService exports getBikeBySlug');
  assert(bikeContent.includes('export const getBikeVariants'), 'bikeService exports getBikeVariants');

  const indexServicePath = path.resolve(servicesDir, 'index.js');
  assert(fs.existsSync(indexServicePath), 'services/index.js central barrel exists');

  // --- 2. Audit Utilities & Formatters ---
  console.log('\n2. Auditing Frontend Formatters Utility:');
  const formattersPath = path.resolve(__dirname, 'client/src/utils/formatters.js');
  assert(fs.existsSync(formattersPath), 'utils/formatters.js exists');
  const formattersContent = fs.readFileSync(formattersPath, 'utf-8');
  assert(formattersContent.includes('formatCurrency'), 'formatters.js exports formatCurrency');
  assert(formattersContent.includes('formatPriceLakhs'), 'formatters.js exports formatPriceLakhs');
  assert(formattersContent.includes('formatPriceRange'), 'formatters.js exports formatPriceRange');

  // --- 3. Audit Routes Configuration ---
  console.log('\n3. Auditing Routes Configuration in AppRoutes.jsx:');
  const appRoutesPath = path.resolve(__dirname, 'client/src/routes/AppRoutes.jsx');
  const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf-8');
  assert(appRoutesContent.includes('path="showrooms"'), 'AppRoutes registers showrooms route');
  assert(appRoutesContent.includes('path="showrooms/:slug"'), 'AppRoutes registers showrooms/:slug route');
  assert(appRoutesContent.includes('path="bikes"'), 'AppRoutes registers bikes route');
  assert(appRoutesContent.includes('path="bikes/:slug"'), 'AppRoutes registers bikes/:slug route');
  assert(appRoutesContent.includes('ShowroomDetailPage'), 'AppRoutes imports ShowroomDetailPage');
  assert(appRoutesContent.includes('BikeDetailPage'), 'AppRoutes imports BikeDetailPage');

  // --- 4. Audit HomePage Real Integration ---
  console.log('\n4. Auditing HomePage Real API Integration:');
  const homePath = path.resolve(__dirname, 'client/src/pages/HomePage.jsx');
  const homeContent = fs.readFileSync(homePath, 'utf-8');
  assert(homeContent.includes('getBrands'), 'HomePage imports getBrands');
  assert(homeContent.includes('getCities'), 'HomePage imports getCities');
  assert(homeContent.includes('getBikes'), 'HomePage imports getBikes');
  assert(homeContent.includes('getShowrooms'), 'HomePage imports getShowrooms');
  assert(homeContent.includes('brandsLoading'), 'HomePage handles independent brands loading state');
  assert(homeContent.includes('citiesLoading'), 'HomePage handles independent cities loading state');
  assert(homeContent.includes('bikesLoading'), 'HomePage handles independent bikes loading state');
  assert(homeContent.includes('showroomsLoading'), 'HomePage handles independent showrooms loading state');
  assert(homeContent.includes('brandsError'), 'HomePage handles graceful brands error fallback');
  assert(homeContent.includes('citiesError'), 'HomePage handles graceful cities error fallback');
  assert(homeContent.includes('bikesError'), 'HomePage handles graceful bikes error fallback');
  assert(homeContent.includes('showroomsError'), 'HomePage handles graceful showrooms error fallback');

  // --- 5. Audit Showroom Pages Implementation ---
  console.log('\n5. Auditing Showroom Pages (Listing & Detail):');
  const showroomsPagePath = path.resolve(__dirname, 'client/src/pages/ShowroomsPage.jsx');
  const showroomsPageContent = fs.readFileSync(showroomsPagePath, 'utf-8');
  assert(showroomsPageContent.includes('useSearchParams'), 'ShowroomsPage uses useSearchParams for query state');
  assert(showroomsPageContent.includes('getShowrooms'), 'ShowroomsPage calls getShowrooms');
  assert(showroomsPageContent.includes('getBrands'), 'ShowroomsPage loads dynamic brands filter');
  assert(showroomsPageContent.includes('getCities'), 'ShowroomsPage loads dynamic cities filter');
  assert(showroomsPageContent.includes('ErrorState'), 'ShowroomsPage handles ErrorState');
  assert(showroomsPageContent.includes('EmptyState'), 'ShowroomsPage handles EmptyState');

  const showroomDetailPath = path.resolve(__dirname, 'client/src/pages/ShowroomDetailPage.jsx');
  assert(fs.existsSync(showroomDetailPath), 'ShowroomDetailPage.jsx exists');
  const showroomDetailContent = fs.readFileSync(showroomDetailPath, 'utf-8');
  assert(showroomDetailContent.includes('getShowroomBySlug'), 'ShowroomDetailPage calls getShowroomBySlug');
  assert(showroomDetailContent.includes('useParams'), 'ShowroomDetailPage uses useParams for slug');
  assert(showroomDetailContent.includes('ErrorState'), 'ShowroomDetailPage handles ErrorState');
  assert(showroomDetailContent.includes('address'), 'ShowroomDetailPage renders real address data');
  assert(showroomDetailContent.includes('facilities'), 'ShowroomDetailPage renders real facilities');

  // --- 6. Audit Bike Pages Implementation ---
  console.log('\n6. Auditing Bike Pages (Listing & Detail):');
  const bikesPagePath = path.resolve(__dirname, 'client/src/pages/BikesPage.jsx');
  const bikesPageContent = fs.readFileSync(bikesPagePath, 'utf-8');
  assert(bikesPageContent.includes('useSearchParams'), 'BikesPage uses useSearchParams for query state');
  assert(bikesPageContent.includes('getBikes'), 'BikesPage calls getBikes');
  assert(bikesPageContent.includes('CATEGORIES'), 'BikesPage defines category enums');
  assert(bikesPageContent.includes('FUEL_TYPES'), 'BikesPage defines fuelType enums');
  assert(bikesPageContent.includes('ErrorState'), 'BikesPage handles ErrorState');
  assert(bikesPageContent.includes('EmptyState'), 'BikesPage handles EmptyState');

  const bikeDetailPath = path.resolve(__dirname, 'client/src/pages/BikeDetailPage.jsx');
  assert(fs.existsSync(bikeDetailPath), 'BikeDetailPage.jsx exists');
  const bikeDetailContent = fs.readFileSync(bikeDetailPath, 'utf-8');
  assert(bikeDetailContent.includes('getBikeBySlug'), 'BikeDetailPage calls getBikeBySlug');
  assert(bikeDetailContent.includes('getBikeVariants'), 'BikeDetailPage calls getBikeVariants');
  assert(bikeDetailContent.includes('useParams'), 'BikeDetailPage uses useParams for slug');
  assert(bikeDetailContent.includes('engine'), 'BikeDetailPage renders engine technical specifications');
  assert(bikeDetailContent.includes('variants'), 'BikeDetailPage renders real trim variants');

  // --- 7. Live Database & Backend API Verification ---
  console.log('\n7. Setting Up Live Server for Real Contract Validation:');
  const { default: app } = await import('./server/src/app.js');
  const { connectDatabase } = await import('./server/src/config/database.js');

  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`  Live test server listening on ${baseUrl}`);

  try {
    // 7A. Brands API Contract
    console.log('\n8. Validating Brands API Contract for Frontend:');
    const brandsRes = await axios.get(`${baseUrl}/brands?limit=4`);
    assert(brandsRes.data.success === true, 'GET /api/brands returns success: true');
    assert(Array.isArray(brandsRes.data.data), 'GET /api/brands data is an array');
    assert(brandsRes.data.data.length <= 4, 'GET /api/brands obeys limit parameter');
    assert(brandsRes.data.meta && brandsRes.data.meta.page !== undefined, 'GET /api/brands includes pagination meta');

    const brandSlug = brandsRes.data.data[0].slug;
    const singleBrandRes = await axios.get(`${baseUrl}/brands/${brandSlug}`);
    assert(singleBrandRes.data.success === true, `GET /api/brands/${brandSlug} returns success: true`);
    assert(singleBrandRes.data.data.name !== undefined, 'Single brand contains name');

    // 7B. Cities API Contract
    console.log('\n9. Validating Cities API Contract for Frontend:');
    const citiesRes = await axios.get(`${baseUrl}/cities?limit=6`);
    assert(citiesRes.data.success === true, 'GET /api/cities returns success: true');
    assert(Array.isArray(citiesRes.data.data), 'GET /api/cities data is an array');
    assert(citiesRes.data.data.length <= 6, 'GET /api/cities obeys limit parameter');

    const citySlug = citiesRes.data.data[0].slug;
    const singleCityRes = await axios.get(`${baseUrl}/cities/${citySlug}`);
    assert(singleCityRes.data.success === true, `GET /api/cities/${citySlug} returns success: true`);

    // 7C. Showrooms API Contract & Filters
    console.log('\n10. Validating Showrooms API Contract & Filters for Frontend:');
    const showroomsRes = await axios.get(`${baseUrl}/showrooms?limit=3`);
    assert(showroomsRes.data.success === true, 'GET /api/showrooms returns success: true');
    assert(Array.isArray(showroomsRes.data.data), 'GET /api/showrooms data is an array');
    assert(showroomsRes.data.data.length <= 3, 'GET /api/showrooms obeys limit parameter');

    // Test Showroom Type filter
    const premiaShowrooms = await axios.get(
      `${baseUrl}/showrooms?showroomType=${encodeURIComponent('Premia Flagship')}`
    );
    assert(premiaShowrooms.data.success === true, 'GET /api/showrooms?showroomType=Premia Flagship succeeds');
    assert(
      premiaShowrooms.data.data.every((s) => s.showroomType === 'Premia Flagship'),
      'All filtered showrooms have showroomType: Premia Flagship'
    );

    // Test Showroom Slug lookup
    const showroomSlug = showroomsRes.data.data[0].slug;
    const singleShowroomRes = await axios.get(`${baseUrl}/showrooms/${showroomSlug}`);
    assert(singleShowroomRes.data.success === true, `GET /api/showrooms/${showroomSlug} returns success`);
    assert(singleShowroomRes.data.data.brand && singleShowroomRes.data.data.brand.name, 'Showroom populates brand relationship');
    assert(singleShowroomRes.data.data.city && singleShowroomRes.data.data.city.name, 'Showroom populates city relationship');
    assert(singleShowroomRes.data.data.address && singleShowroomRes.data.data.address.street, 'Showroom has address data');

    // 7D. Bikes API Contract, Filters & Variants
    console.log('\n11. Validating Bikes API Contract & Variants for Frontend:');
    const bikesRes = await axios.get(`${baseUrl}/bikes?limit=4`);
    assert(bikesRes.data.success === true, 'GET /api/bikes returns success: true');
    assert(Array.isArray(bikesRes.data.data), 'GET /api/bikes data is an array');
    assert(bikesRes.data.data.length <= 4, 'GET /api/bikes obeys limit parameter');

    // Test Category filter
    const commuterBikes = await axios.get(`${baseUrl}/bikes?category=Commuter`);
    assert(commuterBikes.data.success === true, 'GET /api/bikes?category=Commuter succeeds');
    assert(
      commuterBikes.data.data.every((b) => b.category === 'Commuter'),
      'All filtered bikes have category: Commuter'
    );

    // Test Fuel Type filter
    const petrolBikes = await axios.get(`${baseUrl}/bikes?fuelType=Petrol`);
    assert(petrolBikes.data.success === true, 'GET /api/bikes?fuelType=Petrol succeeds');
    assert(
      petrolBikes.data.data.every((b) => b.fuelType === 'Petrol'),
      'All filtered bikes have fuelType: Petrol'
    );

    // Test Bike Detail Lookup & Variants
    // Find an active bike model from catalogue that has variants configured
    const activeBikes = bikesRes.data.data.filter((b) => b.isActive !== false);
    let targetBikeSlug = null;
    let targetVariants = [];

    // Search active bikes for one with variants, or fall back to checking available catalogue bikes
    const candidates = activeBikes.length > 0 ? activeBikes : bikesRes.data.data;
    for (const candidate of candidates) {
      try {
        const checkRes = await axios.get(`${baseUrl}/bikes/${candidate.slug}/variants`);
        if (checkRes.data?.success && Array.isArray(checkRes.data.data) && checkRes.data.data.length > 0) {
          targetBikeSlug = candidate.slug;
          targetVariants = checkRes.data.data;
          break;
        }
      } catch {
        // Continue searching candidates
      }
    }

    // Defensive check: Ensure the database contains at least one bike with variants to validate
    assert(targetBikeSlug !== null, 'Found an active bike model in catalogue with configured variants');

    const singleBikeRes = await axios.get(`${baseUrl}/bikes/${targetBikeSlug}`);
    assert(singleBikeRes.data.success === true, `GET /api/bikes/${targetBikeSlug} returns success`);
    assert(singleBikeRes.data.data.brand && singleBikeRes.data.data.brand.name, 'Bike populates brand relationship');
    assert(singleBikeRes.data.data.engine !== undefined, 'Bike has engine specifications data');

    // Test Bike Variants Endpoint Contract
    const variantsRes = await axios.get(`${baseUrl}/bikes/${targetBikeSlug}/variants`);
    assert(variantsRes.data.success === true, `GET /api/bikes/${targetBikeSlug}/variants returns success`);
    assert(Array.isArray(variantsRes.data.data), 'Variants data is an array');
    assert(variantsRes.data.data.length >= 1, 'Bike has at least 1 variant available');
    assert(variantsRes.data.data[0].exShowroomPrice > 0, 'Variant contains positive exShowroomPrice');

    // 7E. Error Handling & 404
    console.log('\n12. Validating 404 / Error Envelopes for Frontend:');
    try {
      await axios.get(`${baseUrl}/showrooms/non-existent-showroom-slug-xyz`);
      assert(false, 'Expected 404 for missing showroom slug');
    } catch (err) {
      assert(err.response?.status === 404, 'Missing showroom slug returns 404');
      assert(err.response?.data?.success === false, '404 error envelope has success: false');
    }

    try {
      await axios.get(`${baseUrl}/bikes/non-existent-bike-slug-xyz`);
      assert(false, 'Expected 404 for missing bike slug');
    } catch (err) {
      assert(err.response?.status === 404, 'Missing bike slug returns 404');
      assert(err.response?.data?.success === false, '404 error envelope has success: false');
    }

  } finally {
    server.close();
    await mongoose.connection.close();
  }

  // --- Summary ---
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${totalChecks}`);
  console.log(`PASSED: ${passedChecks}`);
  console.log(`FAILED: ${failedChecks}`);
  console.log('=====================================================');

  if (failedChecks === 0) {
    console.log('\n🎉 ALL PHASE 2 STEP 4 INTEGRATION AUDIT CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failedChecks} ERRORS\n`);
    process.exit(1);
  }
}

runStep4Audit().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
