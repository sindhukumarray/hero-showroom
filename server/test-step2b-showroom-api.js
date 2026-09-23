const http = require('http');
const app = require('./src/app');
const { Showroom, Brand, City } = require('./src/models');
const showroomController = require('./src/controllers/showroomController');
const showroomService = require('./src/services/showroomService');
const showroomValidator = require('./src/validators/showroomValidator');
const showroomRoutes = require('./src/routes/showroomRoutes');
const apiRoutes = require('./src/routes');

async function runStep2BTests() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 2 STEP 2B SHOWROOM API AUDIT  ');
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

  // 1. Audit Showroom Model
  console.log('1. Auditing Showroom Model:');
  assert(Boolean(Showroom), 'Showroom model imported successfully');
  assert(Boolean(Showroom.schema), 'Showroom has valid Mongoose schema');

  // 2. Audit Showroom Controller Imports
  console.log('\n2. Auditing Showroom Controller Imports:');
  assert(typeof showroomController.getShowrooms === 'function', 'showroomController.getShowrooms is a function');
  assert(typeof showroomController.getShowroomBySlug === 'function', 'showroomController.getShowroomBySlug is a function');
  assert(typeof showroomController.getNearbyShowrooms === 'function', 'showroomController.getNearbyShowrooms is a function');

  // 3. Audit Showroom Service Imports
  console.log('\n3. Auditing Showroom Service Imports:');
  assert(typeof showroomService.getShowrooms === 'function', 'showroomService.getShowrooms is a function');
  assert(typeof showroomService.getShowroomBySlug === 'function', 'showroomService.getShowroomBySlug is a function');
  assert(typeof showroomService.getNearbyShowrooms === 'function', 'showroomService.getNearbyShowrooms is a function');
  assert(typeof showroomService.escapeRegex === 'function', 'showroomService.escapeRegex utility is exported');
  assert(Boolean(showroomService.SORT_MAP), 'showroomService.SORT_MAP whitelist is exported');

  // 4. Audit Showroom Validator Imports
  console.log('\n4. Auditing Showroom Validator Imports:');
  assert(typeof showroomValidator.validateShowroomQuery === 'function', 'showroomValidator.validateShowroomQuery is a function');
  assert(typeof showroomValidator.validateShowroomSlug === 'function', 'showroomValidator.validateShowroomSlug is a function');
  assert(typeof showroomValidator.validateNearbyQuery === 'function', 'showroomValidator.validateNearbyQuery is a function');
  assert(Array.isArray(showroomValidator.ALLOWED_SHOWROOM_TYPES), 'ALLOWED_SHOWROOM_TYPES array is exported');
  assert(Array.isArray(showroomValidator.ALLOWED_SORTS), 'ALLOWED_SORTS array is exported');

  // 5. Audit Showroom Route Imports
  console.log('\n5. Auditing Showroom Route Imports:');
  assert(Boolean(showroomRoutes), 'showroomRoutes router is imported');

  // 6. Audit Route Mounted at /api/showrooms
  console.log('\n6. Auditing Route Mounting in Central Router:');
  const mountedRouters = apiRoutes.stack ? apiRoutes.stack.filter((layer) => layer.name === 'router') : [];
  assert(mountedRouters.length >= 4, 'Central API router mounts at least 4 sub-routers (health, brands, cities, showrooms)');

  // 7, 8 & 27. Inspect Route Ordering within showroomRoutes
  console.log('\n7. Auditing Showroom Sub-Route Ordering:');
  const routeLayers = showroomRoutes.stack ? showroomRoutes.stack.filter((r) => r.route) : [];
  const routePaths = routeLayers.map((r) => r.route.path);

  assert(routePaths.includes('/'), "GET /api/showrooms root route exists");
  assert(routePaths.includes('/nearby'), "GET /api/showrooms/nearby route exists");
  assert(routePaths.includes('/:slug'), "GET /api/showrooms/:slug route exists");

  const nearbyIndex = routePaths.indexOf('/nearby');
  const slugIndex = routePaths.indexOf('/:slug');
  assert(
    nearbyIndex !== -1 && slugIndex !== -1 && nearbyIndex < slugIndex,
    "Route Ordering: '/nearby' is registered before '/:slug' to prevent path collision"
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

  // 9. Invalid page rejected
  console.log('\n9. Auditing Pagination Validation:');
  const negPageRes = await makeRequest('/api/showrooms?page=-5');
  assert(
    negPageRes.status === 400 && negPageRes.data.success === false,
    'Negative page parameter is rejected with 400',
    JSON.stringify(negPageRes.data)
  );

  const zeroPageRes = await makeRequest('/api/showrooms?page=0');
  assert(
    zeroPageRes.status === 400 && zeroPageRes.data.success === false,
    'Zero page parameter is rejected with 400'
  );

  const stringPageRes = await makeRequest('/api/showrooms?page=abc');
  assert(
    stringPageRes.status === 400 && stringPageRes.data.success === false,
    'Non-integer page parameter is rejected with 400'
  );

  // 10. Invalid limit rejected
  const negLimitRes = await makeRequest('/api/showrooms?limit=-1');
  assert(
    negLimitRes.status === 400 && negLimitRes.data.success === false,
    'Negative limit parameter is rejected with 400'
  );

  const zeroLimitRes = await makeRequest('/api/showrooms?limit=0');
  assert(
    zeroLimitRes.status === 400 && zeroLimitRes.data.success === false,
    'Zero limit parameter is rejected with 400'
  );

  // 11. limit > 100 rejected
  const overLimitRes = await makeRequest('/api/showrooms?limit=101');
  assert(
    overLimitRes.status === 400 && overLimitRes.data.success === false,
    'Limit parameter > 100 is rejected with 400',
    JSON.stringify(overLimitRes.data)
  );

  // 12. Invalid brand ObjectId rejected
  console.log('\n10. Auditing ObjectId & Filter Validation:');
  const invalidBrandRes = await makeRequest('/api/showrooms?brand=not-a-valid-id');
  assert(
    invalidBrandRes.status === 400 && invalidBrandRes.data.success === false,
    'Invalid brand ObjectId format is rejected with 400',
    JSON.stringify(invalidBrandRes.data)
  );

  // 13. Invalid city ObjectId rejected
  const invalidCityRes = await makeRequest('/api/showrooms?city=12345');
  assert(
    invalidCityRes.status === 400 && invalidCityRes.data.success === false,
    'Invalid city ObjectId format is rejected with 400'
  );

  // 14. Invalid showroomType rejected
  const invalidTypeRes = await makeRequest('/api/showrooms?showroomType=SuperStore');
  assert(
    invalidTypeRes.status === 400 && invalidTypeRes.data.success === false,
    'Invalid showroomType enum value is rejected with 400',
    JSON.stringify(invalidTypeRes.data)
  );

  // 15. Invalid isActive rejected
  const invalidActiveRes = await makeRequest('/api/showrooms?isActive=not_boolean');
  assert(
    invalidActiveRes.status === 400 && invalidActiveRes.data.success === false,
    "Invalid isActive value 'not_boolean' is rejected with 400"
  );

  // 16. Invalid sort rejected
  console.log('\n11. Auditing Sort Whitelist Validation:');
  const invalidSortRes = await makeRequest('/api/showrooms?sort=unknownSort');
  assert(
    invalidSortRes.status === 400 && invalidSortRes.data.success === false,
    "Invalid sort value 'unknownSort' is rejected with 400",
    JSON.stringify(invalidSortRes.data)
  );

  // 17. Invalid slug rejected
  console.log('\n12. Auditing Slug & Operator Security:');
  const invalidSlugRes = await makeRequest('/api/showrooms/bad$$slug@@');
  assert(
    invalidSlugRes.status === 400 && invalidSlugRes.data.success === false,
    'Slug containing unsafe characters is rejected with 400'
  );

  // 18. Invalid $ query operators rejected
  const operatorRes = await makeRequest('/api/showrooms?$gt=1');
  assert(
    operatorRes.status === 400 && operatorRes.data.success === false,
    "Query parameter starting with '$' is rejected with 400",
    JSON.stringify(operatorRes.data)
  );

  // 19. Missing showroom slug returns appropriate 404 behavior (mocked DB state)
  console.log('\n13. Auditing Showroom Slug 404 Behavior (Mocked DB State):');
  const origFindOne = Showroom.findOne;
  Showroom._mockActive = true;
  Showroom.findOne = () => ({
    populate: () => ({
      populate: () => ({
        select: () => ({
          lean: async () => null // Simulates database searched and found no record
        })
      })
    })
  });

  const missingShowroomRes = await makeRequest('/api/showrooms/non-existent-showroom');
  assert(
    missingShowroomRes.status === 404 &&
      missingShowroomRes.data.success === false &&
      missingShowroomRes.data.message === 'Showroom not found',
    'Missing showroom slug returns 404 with standardized error envelope',
    JSON.stringify(missingShowroomRes.data)
  );

  // Restore Showroom.findOne
  Showroom.findOne = origFindOne;
  delete Showroom._mockActive;

  // 20. Existing /api/brands continues working
  console.log('\n14. Auditing Existing Routes (Regression):');
  const brandsRes = await makeRequest('/api/brands');
  assert(
    brandsRes.status === 503 || brandsRes.status === 200,
    `Existing /api/brands responds through Express (status: ${brandsRes.status})`
  );

  // 21. Existing /api/cities continues working
  const citiesRes = await makeRequest('/api/cities');
  assert(
    citiesRes.status === 503 || citiesRes.status === 200,
    `Existing /api/cities responds through Express (status: ${citiesRes.status})`
  );

  // 22. Existing /api/health continues working
  const healthRes = await makeRequest('/api/health');
  assert(
    healthRes.status === 200 &&
      healthRes.data.success === true &&
      healthRes.data.message === 'Hero Showroom API is running',
    'Existing /api/health responds with 200 OK and expected PRD message'
  );

  // 23. Missing lat/lng rejected on /nearby
  console.log('\n15. Auditing Geospatial Nearby Validation (/api/showrooms/nearby):');
  const missingCoordsRes = await makeRequest('/api/showrooms/nearby');
  assert(
    missingCoordsRes.status === 400 && missingCoordsRes.data.success === false,
    'Missing lat and lng parameters are rejected with 400',
    JSON.stringify(missingCoordsRes.data)
  );

  const missingLngRes = await makeRequest('/api/showrooms/nearby?lat=19.0760');
  assert(
    missingLngRes.status === 400 && missingLngRes.data.success === false,
    'Missing lng parameter is rejected with 400'
  );

  // 24. Invalid latitude rejected
  const invalidLatRes = await makeRequest('/api/showrooms/nearby?lat=95&lng=72.8777');
  assert(
    invalidLatRes.status === 400 && invalidLatRes.data.success === false,
    'Latitude > 90 is rejected with 400',
    JSON.stringify(invalidLatRes.data)
  );

  // 25. Invalid longitude rejected
  const invalidLngRes = await makeRequest('/api/showrooms/nearby?lat=19.0760&lng=-195');
  assert(
    invalidLngRes.status === 400 && invalidLngRes.data.success === false,
    'Longitude < -180 is rejected with 400',
    JSON.stringify(invalidLngRes.data)
  );

  // 26. Invalid maxDistance rejected
  const invalidDistRes = await makeRequest('/api/showrooms/nearby?lat=19.0760&lng=72.8777&maxDistance=-500');
  assert(
    invalidDistRes.status === 400 && invalidDistRes.data.success === false,
    'Negative maxDistance is rejected with 400',
    JSON.stringify(invalidDistRes.data)
  );

  const overDistRes = await makeRequest('/api/showrooms/nearby?lat=19.0760&lng=72.8777&maxDistance=999999');
  assert(
    overDistRes.status === 400 && overDistRes.data.success === false,
    'maxDistance > 500,000 meters is rejected with 400'
  );

  // 28. Collection Pagination & Population Metadata (Mocked DB State)
  console.log('\n16. Auditing Collection Responses & Population (Mocked DB State):');
  const origFind = Showroom.find;
  const origCount = Showroom.countDocuments;
  Showroom._mockActive = true;

  Showroom.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          populate: () => ({
            populate: () => ({
              select: () => ({
                lean: async () => [
                  {
                    name: 'Hero Premia South Mumbai',
                    slug: 'hero-premia-south-mumbai',
                    showroomType: 'Premia Flagship',
                    brand: { _id: '507f1f77bcf86cd799439011', name: 'Hero Premia', slug: 'hero-premia' },
                    city: { _id: '507f1f77bcf86cd799439012', name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
                    location: { type: 'Point', coordinates: [72.8258, 18.975] },
                    isActive: true
                  }
                ]
              })
            })
          })
        })
      })
    })
  });
  Showroom.countDocuments = async () => 1;

  const mockCollectionRes = await makeRequest('/api/showrooms?page=1&limit=20');
  assert(
    mockCollectionRes.status === 200 &&
      mockCollectionRes.data.success === true &&
      Array.isArray(mockCollectionRes.data.data) &&
      mockCollectionRes.data.data.length === 1 &&
      mockCollectionRes.data.meta &&
      mockCollectionRes.data.meta.page === 1 &&
      mockCollectionRes.data.meta.limit === 20 &&
      mockCollectionRes.data.meta.total === 1 &&
      mockCollectionRes.data.meta.pages === 1,
    'GET /api/showrooms returns standardized collection shape with pagination meta',
    JSON.stringify(mockCollectionRes.data.meta)
  );

  // Detail query populated response
  Showroom.findOne = () => ({
    populate: () => ({
      populate: () => ({
        select: () => ({
          lean: async () => ({
            name: 'Hero Premia South Mumbai',
            slug: 'hero-premia-south-mumbai',
            showroomType: 'Premia Flagship',
            brand: { _id: '507f1f77bcf86cd799439011', name: 'Hero Premia', slug: 'hero-premia', logo: '' },
            city: { _id: '507f1f77bcf86cd799439012', name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
            location: { type: 'Point', coordinates: [72.8258, 18.975] },
            contact: { phone: '+91 9876543210', email: 'southmumbai@heropremia.com' }
          })
        })
      })
    })
  });

  const mockDetailRes = await makeRequest('/api/showrooms/hero-premia-south-mumbai');
  assert(
    mockDetailRes.status === 200 &&
      mockDetailRes.data.success === true &&
      mockDetailRes.data.data &&
      mockDetailRes.data.data.slug === 'hero-premia-south-mumbai' &&
      mockDetailRes.data.data.brand &&
      mockDetailRes.data.data.city,
    'GET /api/showrooms/:slug returns showroom with populated brand and city relationships',
    JSON.stringify(mockDetailRes.data.data.name)
  );

  // Nearby query mock
  Showroom.find = () => ({
    limit: () => ({
      populate: () => ({
        populate: () => ({
          select: () => ({
            lean: async () => [
              {
                name: 'Hero Premia South Mumbai',
                slug: 'hero-premia-south-mumbai',
                location: { type: 'Point', coordinates: [72.8258, 18.975] }
              }
            ]
          })
        })
      })
    })
  });

  const mockNearbyRes = await makeRequest('/api/showrooms/nearby?lat=18.975&lng=72.8258&maxDistance=10000');
  assert(
    mockNearbyRes.status === 200 &&
      mockNearbyRes.data.success === true &&
      Array.isArray(mockNearbyRes.data.data) &&
      mockNearbyRes.data.meta &&
      mockNearbyRes.data.meta.coordinates[0] === 72.8258 &&
      mockNearbyRes.data.meta.coordinates[1] === 18.975,
    'GET /api/showrooms/nearby returns nearby showrooms with coordinates metadata',
    JSON.stringify(mockNearbyRes.data.meta)
  );

  // Teardown mocks
  Showroom.find = origFind;
  Showroom.findOne = origFindOne;
  Showroom.countDocuments = origCount;
  delete Showroom._mockActive;

  // Close ephemeral server
  server.close();

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 2 STEP 2B SHOWROOM API AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runStep2BTests().catch((err) => {
  console.error('Fatal error running Step 2B tests:', err);
  process.exit(1);
});
