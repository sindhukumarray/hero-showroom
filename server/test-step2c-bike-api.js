const http = require('http');
const app = require('./src/app');
const { Bike, BikeVariant, Brand, City, Showroom } = require('./src/models');
const bikeController = require('./src/controllers/bikeController');
const bikeService = require('./src/services/bikeService');
const bikeValidator = require('./src/validators/bikeValidator');
const bikeRoutes = require('./src/routes/bikeRoutes');

const bikeVariantController = require('./src/controllers/bikeVariantController');
const bikeVariantService = require('./src/services/bikeVariantService');
const bikeVariantValidator = require('./src/validators/bikeVariantValidator');
const bikeVariantRoutes = require('./src/routes/bikeVariantRoutes');

const apiRoutes = require('./src/routes');

async function runStep2CTests() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 2 STEP 2C BIKE & VARIANT AUDIT');
  console.log('=====================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  const assert = (condition, description, extra = '') => {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  };

  // 1 & 2. Audit Model Imports
  console.log('1. Auditing Bike & BikeVariant Models:');
  assert(Boolean(Bike), 'Bike model imported successfully');
  assert(Boolean(Bike.schema), 'Bike has valid Mongoose schema');
  assert(Boolean(BikeVariant), 'BikeVariant model imported successfully');
  assert(Boolean(BikeVariant.schema), 'BikeVariant has valid Mongoose schema');

  // 3 & 4. Audit Bike Controller & Service Imports
  console.log('\n2. Auditing Bike Controller & Service:');
  assert(typeof bikeController.getBikes === 'function', 'bikeController.getBikes is a function');
  assert(typeof bikeController.getBikeBySlug === 'function', 'bikeController.getBikeBySlug is a function');
  assert(typeof bikeService.getBikes === 'function', 'bikeService.getBikes is a function');
  assert(typeof bikeService.getBikeBySlug === 'function', 'bikeService.getBikeBySlug is a function');
  assert(typeof bikeService.escapeRegex === 'function', 'bikeService.escapeRegex is exported');
  assert(Boolean(bikeService.SORT_MAP), 'bikeService.SORT_MAP whitelist is exported');

  // 5 & 6. Audit Bike Validator & Route Imports
  console.log('\n3. Auditing Bike Validator & Routes:');
  assert(typeof bikeValidator.validateBikeQuery === 'function', 'bikeValidator.validateBikeQuery is a function');
  assert(typeof bikeValidator.validateBikeSlug === 'function', 'bikeValidator.validateBikeSlug is a function');
  assert(Array.isArray(bikeValidator.ALLOWED_CATEGORIES), 'ALLOWED_CATEGORIES array is exported');
  assert(Array.isArray(bikeValidator.ALLOWED_FUEL_TYPES), 'ALLOWED_FUEL_TYPES array is exported');
  assert(Array.isArray(bikeValidator.ALLOWED_SORTS), 'ALLOWED_SORTS array is exported');
  assert(Boolean(bikeRoutes), 'bikeRoutes router is imported');

  // 7 & 8. Audit BikeVariant Controller & Service Imports
  console.log('\n4. Auditing BikeVariant Controller & Service:');
  assert(typeof bikeVariantController.getBikeVariants === 'function', 'bikeVariantController.getBikeVariants is a function');
  assert(typeof bikeVariantService.getBikeVariants === 'function', 'bikeVariantService.getBikeVariants is a function');
  assert(Boolean(bikeVariantService.VARIANT_SORT_MAP), 'bikeVariantService.VARIANT_SORT_MAP is exported');

  // 9 & 10. Audit BikeVariant Validator & Route Imports
  console.log('\n5. Auditing BikeVariant Validator & Routes:');
  assert(typeof bikeVariantValidator.validateBikeVariantQuery === 'function', 'bikeVariantValidator.validateBikeVariantQuery is a function');
  assert(Array.isArray(bikeVariantValidator.ALLOWED_VARIANT_SORTS), 'ALLOWED_VARIANT_SORTS is exported');
  assert(Boolean(bikeVariantRoutes), 'bikeVariantRoutes router is imported');

  // 11. Audit Mount Point in Route Registry
  console.log('\n6. Auditing Central API Registry Mounting:');
  const mountedRouters = apiRoutes.stack ? apiRoutes.stack.filter((layer) => layer.name === 'router') : [];
  assert(mountedRouters.length >= 5, 'Central API router mounts at least 5 sub-routers (health, brands, cities, showrooms, bikes)');

  // 12, 13 & 14. Audit Bike Sub-Routes & Ordering
  console.log('\n7. Auditing Bike Sub-Routes & Precedence:');
  const bikeRouteLayers = bikeRoutes.stack ? bikeRoutes.stack.filter((r) => r.route) : [];
  const bikeRoutePaths = bikeRouteLayers.map((r) => r.route.path);

  assert(bikeRoutePaths.includes('/'), "GET /api/bikes root route exists");
  assert(bikeRoutePaths.includes('/:slug/variants'), "GET /api/bikes/:slug/variants route exists");
  assert(bikeRoutePaths.includes('/:slug'), "GET /api/bikes/:slug route exists");

  const variantsIndex = bikeRoutePaths.indexOf('/:slug/variants');
  const slugIndex = bikeRoutePaths.indexOf('/:slug');
  assert(
    variantsIndex !== -1 && slugIndex !== -1 && variantsIndex < slugIndex,
    "Route Ordering: '/:slug/variants' precedes '/:slug' to avoid dynamic path collision"
  );

  // Set up ephemeral HTTP server for Express request verification
  console.log('\n8. Setting up Ephemeral HTTP Server for Integration Testing:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const makeRequest = (path, method = 'GET') => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: port,
          path: path,
          method: method
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  };

  // 15. Invalid page rejected
  console.log('\n9. Auditing Bike Query Validation (Pagination):');
  const negPageRes = await makeRequest('/api/bikes?page=-1');
  assert(
    negPageRes.status === 400 && negPageRes.data.success === false,
    'Negative page parameter is rejected with 400',
    JSON.stringify(negPageRes.data)
  );

  // 16. Invalid limit rejected
  const zeroLimitRes = await makeRequest('/api/bikes?limit=0');
  assert(
    zeroLimitRes.status === 400 && zeroLimitRes.data.success === false,
    'Zero limit parameter is rejected with 400'
  );

  // 17. limit > 100 rejected
  const overLimitRes = await makeRequest('/api/bikes?limit=101');
  assert(
    overLimitRes.status === 400 && overLimitRes.data.success === false,
    'Limit parameter > 100 is rejected with 400'
  );

  // 18. Invalid brand ObjectId rejected
  console.log('\n10. Auditing Bike Filter Validation (Brand & Enums):');
  const invalidBrandRes = await makeRequest('/api/bikes?brand=invalid-object-id');
  assert(
    invalidBrandRes.status === 400 && invalidBrandRes.data.success === false,
    'Invalid brand ObjectId format is rejected with 400',
    JSON.stringify(invalidBrandRes.data)
  );

  // 19. Invalid enum values rejected
  const invalidCategoryRes = await makeRequest('/api/bikes?category=Superbike');
  assert(
    invalidCategoryRes.status === 400 && invalidCategoryRes.data.success === false,
    'Invalid category enum is rejected with 400',
    JSON.stringify(invalidCategoryRes.data)
  );

  const invalidFuelRes = await makeRequest('/api/bikes?fuelType=Diesel');
  assert(
    invalidFuelRes.status === 400 && invalidFuelRes.data.success === false,
    'Invalid fuelType enum is rejected with 400'
  );

  // 20. Invalid boolean rejected
  const invalidActiveRes = await makeRequest('/api/bikes?isActive=enabled');
  assert(
    invalidActiveRes.status === 400 && invalidActiveRes.data.success === false,
    "Invalid isActive value 'enabled' is rejected with 400"
  );

  // 21. Invalid price rejected
  console.log('\n11. Auditing Price Range Validation:');
  const negPriceRes = await makeRequest('/api/bikes?minPrice=-5000');
  assert(
    negPriceRes.status === 400 && negPriceRes.data.success === false,
    'Negative minPrice is rejected with 400',
    JSON.stringify(negPriceRes.data)
  );

  const nanPriceRes = await makeRequest('/api/bikes?maxPrice=not-a-number');
  assert(
    nanPriceRes.status === 400 && nanPriceRes.data.success === false,
    'Non-numeric maxPrice is rejected with 400'
  );

  // 22. minPrice > maxPrice rejected
  const invertedPriceRes = await makeRequest('/api/bikes?minPrice=150000&maxPrice=100000');
  assert(
    invertedPriceRes.status === 400 && invertedPriceRes.data.success === false,
    'minPrice > maxPrice is rejected with 400',
    JSON.stringify(invertedPriceRes.data)
  );

  // 23. Invalid sort rejected
  console.log('\n12. Auditing Sort & Security Validation:');
  const invalidSortRes = await makeRequest('/api/bikes?sort=popularity');
  assert(
    invalidSortRes.status === 400 && invalidSortRes.data.success === false,
    "Invalid sort value 'popularity' is rejected with 400"
  );

  // 24. Invalid slug rejected
  const invalidSlugRes = await makeRequest('/api/bikes/splendor$$model');
  assert(
    invalidSlugRes.status === 400 && invalidSlugRes.data.success === false,
    'Slug containing unsafe characters is rejected with 400'
  );

  // 25. $ operator injection rejected
  const operatorRes = await makeRequest('/api/bikes?$where=1');
  assert(
    operatorRes.status === 400 && operatorRes.data.success === false,
    "Query parameter starting with '$' is rejected with 400",
    JSON.stringify(operatorRes.data)
  );

  // 26. Missing bike slug returns appropriate 404 behavior (mocked DB state)
  console.log('\n13. Auditing Bike Slug 404 Behavior (Mocked DB State):');
  const origBikeFindOne = Bike.findOne;
  Bike._mockActive = true;
  const notFoundQuery = {
    select: () => notFoundQuery,
    populate: () => notFoundQuery,
    lean: async () => null
  };
  Bike.findOne = () => notFoundQuery;

  const missingBikeRes = await makeRequest('/api/bikes/non-existent-bike');
  assert(
    missingBikeRes.status === 404 &&
      missingBikeRes.data.success === false &&
      missingBikeRes.data.message === 'Bike not found',
    'Missing bike slug returns 404 with standardized error envelope',
    JSON.stringify(missingBikeRes.data)
  );

  // 27. Existing Brand APIs continue working
  console.log('\n14. Auditing Existing Routes (Regression):');
  const brandsRes = await makeRequest('/api/brands');
  assert(
    brandsRes.status === 503 || brandsRes.status === 200,
    `Existing /api/brands responds through Express (status: ${brandsRes.status})`
  );

  // 28. Existing City APIs continue working
  const citiesRes = await makeRequest('/api/cities');
  assert(
    citiesRes.status === 503 || citiesRes.status === 200,
    `Existing /api/cities responds through Express (status: ${citiesRes.status})`
  );

  // 29. Existing Showroom APIs continue working
  const showroomsRes = await makeRequest('/api/showrooms');
  assert(
    showroomsRes.status === 503 || showroomsRes.status === 200,
    `Existing /api/showrooms responds through Express (status: ${showroomsRes.status})`
  );

  // 30. Existing /api/health continues working
  const healthRes = await makeRequest('/api/health');
  assert(
    healthRes.status === 200 &&
      healthRes.data.success === true &&
      healthRes.data.message === 'Hero Showroom API is running',
    'Existing /api/health responds with 200 OK and expected PRD message'
  );

  // 31. Variant pagination validation works
  console.log('\n15. Auditing Bike Variant Query Validation:');
  const negVariantPageRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?page=-1');
  assert(
    negVariantPageRes.status === 400 && negVariantPageRes.data.success === false,
    'Negative page parameter on variants is rejected with 400'
  );

  const overVariantLimitRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?limit=999');
  assert(
    overVariantLimitRes.status === 400 && overVariantLimitRes.data.success === false,
    'Limit > 100 on variants is rejected with 400'
  );

  // 32. Variant price validation works
  const negVariantPriceRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?minPrice=-100');
  assert(
    negVariantPriceRes.status === 400 && negVariantPriceRes.data.success === false,
    'Negative minPrice on variants is rejected with 400'
  );

  const invertedVariantPriceRes = await makeRequest(
    '/api/bikes/hero-splendor-plus/variants?minPrice=90000&maxPrice=70000'
  );
  assert(
    invertedVariantPriceRes.status === 400 && invertedVariantPriceRes.data.success === false,
    'minPrice > maxPrice on variants is rejected with 400'
  );

  // 33. Variant boolean validation works
  const invalidVariantActiveRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?isActive=invalid');
  assert(
    invalidVariantActiveRes.status === 400 && invalidVariantActiveRes.data.success === false,
    'Invalid isActive on variants is rejected with 400'
  );

  // 34. Variant sort validation works
  const invalidVariantSortRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?sort=fastest');
  assert(
    invalidVariantSortRes.status === 400 && invalidVariantSortRes.data.success === false,
    'Invalid sort value on variants is rejected with 400'
  );

  // 35. Missing parent bike produces appropriate 404 behavior
  console.log('\n16. Auditing Bike Variant 404 on Missing Parent Bike:');
  // Bike.findOne already returns null from mock above
  const missingParentBikeRes = await makeRequest('/api/bikes/unknown-bike-model/variants');
  assert(
    missingParentBikeRes.status === 404 &&
      missingParentBikeRes.data.success === false &&
      missingParentBikeRes.data.message === 'Bike not found',
    'Requesting variants for a non-existent parent bike returns 404'
  );

  // 36. Collection Pagination & Detail with Mocked Data
  console.log('\n17. Auditing Bike Collection & Detail Responses (Mocked DB State):');
  const origBikeFind = Bike.find;
  const origBikeCount = Bike.countDocuments;

  Bike.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          populate: () => ({
            select: () => ({
              lean: async () => [
                {
                  name: 'Hero Splendor Plus',
                  slug: 'hero-splendor-plus',
                  category: 'Commuter',
                  fuelType: 'Petrol',
                  brand: { _id: '507f1f77bcf86cd799439011', name: 'Hero MotoCorp', slug: 'hero-motocorp' },
                  priceRange: { minPrice: 75441, maxPrice: 78286, currency: 'INR' },
                  isActive: true
                }
              ]
            })
          })
        })
      })
    })
  });
  Bike.countDocuments = async () => 1;

  const mockBikeRes = await makeRequest('/api/bikes?page=1&limit=20');
  assert(
    mockBikeRes.status === 200 &&
      mockBikeRes.data.success === true &&
      Array.isArray(mockBikeRes.data.data) &&
      mockBikeRes.data.data.length === 1 &&
      mockBikeRes.data.meta &&
      mockBikeRes.data.meta.page === 1 &&
      mockBikeRes.data.meta.limit === 20 &&
      mockBikeRes.data.meta.total === 1 &&
      mockBikeRes.data.meta.pages === 1,
    'GET /api/bikes returns standardized collection shape with pagination meta',
    JSON.stringify(mockBikeRes.data.meta)
  );

  // Detail query test
  Bike.findOne = () => ({
    populate: () => ({
      select: () => ({
        lean: async () => ({
          name: 'Hero Splendor Plus',
          slug: 'hero-splendor-plus',
          category: 'Commuter',
          fuelType: 'Petrol',
          brand: { _id: '507f1f77bcf86cd799439011', name: 'Hero MotoCorp', slug: 'hero-motocorp', website: 'https://heromotocorp.com' },
          priceRange: { minPrice: 75441, maxPrice: 78286 }
        })
      })
    })
  });

  const mockDetailRes = await makeRequest('/api/bikes/hero-splendor-plus');
  assert(
    mockDetailRes.status === 200 &&
      mockDetailRes.data.success === true &&
      mockDetailRes.data.data.slug === 'hero-splendor-plus' &&
      mockDetailRes.data.data.brand,
    'GET /api/bikes/:slug returns bike model with populated brand relationship'
  );

  // Variant retrieval for existing bike
  const origVariantFind = BikeVariant.find;
  const origVariantCount = BikeVariant.countDocuments;
  BikeVariant._mockActive = true;

  // Mock parent bike found for variant service
  Bike.findOne = () => ({
    select: () => ({
      populate: () => ({
        lean: async () => ({
          _id: '507f1f77bcf86cd799439099',
          name: 'Hero Splendor Plus',
          slug: 'hero-splendor-plus'
        })
      })
    })
  });

  BikeVariant.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          populate: () => ({
            select: () => ({
              lean: async () => [
                {
                  _id: '507f1f77bcf86cd799439088',
                  name: 'Self Start with Alloy Wheel',
                  slug: 'self-start-alloy-wheel',
                  exShowroomPrice: 75441,
                  colors: [{ name: 'Black with Silver', hexCode: '#333333' }],
                  isActive: true
                }
              ]
            })
          })
        })
      })
    })
  });
  BikeVariant.countDocuments = async () => 1;

  const mockVariantRes = await makeRequest('/api/bikes/hero-splendor-plus/variants?page=1&limit=20');
  assert(
    mockVariantRes.status === 200 &&
      mockVariantRes.data.success === true &&
      Array.isArray(mockVariantRes.data.data) &&
      mockVariantRes.data.data.length === 1 &&
      mockVariantRes.data.meta &&
      mockVariantRes.data.meta.total === 1,
    'GET /api/bikes/:slug/variants returns variant collection with pagination meta'
  );

  // Restore mocks
  Bike.find = origBikeFind;
  Bike.findOne = origBikeFindOne;
  Bike.countDocuments = origBikeCount;
  delete Bike._mockActive;

  BikeVariant.find = origVariantFind;
  BikeVariant.countDocuments = origVariantCount;
  delete BikeVariant._mockActive;

  // Close ephemeral server
  server.close();

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 2 STEP 2C BIKE & VARIANT API AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runStep2CTests().catch((err) => {
  console.error('Fatal error running Step 2C tests:', err);
  process.exit(1);
});
