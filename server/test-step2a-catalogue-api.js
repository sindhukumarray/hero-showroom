const http = require('http');
const app = require('./src/app');
const { Brand, City } = require('./src/models');
const brandController = require('./src/controllers/brandController');
const cityController = require('./src/controllers/cityController');
const brandService = require('./src/services/brandService');
const cityService = require('./src/services/cityService');
const brandValidator = require('./src/validators/brandValidator');
const cityValidator = require('./src/validators/cityValidator');
const brandRoutes = require('./src/routes/brandRoutes');
const cityRoutes = require('./src/routes/cityRoutes');
const apiRoutes = require('./src/routes');

async function runStep2ATests() {
  console.log('=====================================================');
  console.log(' HERO SHOWROOM — PHASE 2 STEP 2A CATALOGUE API AUDIT ');
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

  // 1. Audit Brand Route and Sub-Routes
  console.log('1. Auditing Brand Route Existence:');
  assert(Boolean(brandRoutes), 'Brand route router exists');
  const brandRoutePaths = brandRoutes.stack
    ? brandRoutes.stack.filter((r) => r.route).map((r) => r.route.path)
    : [];
  assert(brandRoutePaths.includes('/'), "Brand route has '/' handler");
  assert(brandRoutePaths.includes('/:slug'), "Brand route has '/:slug' handler");

  // 2. Audit City Route and Sub-Routes
  console.log('\n2. Auditing City Route Existence:');
  assert(Boolean(cityRoutes), 'City route router exists');
  const cityRoutePaths = cityRoutes.stack
    ? cityRoutes.stack.filter((r) => r.route).map((r) => r.route.path)
    : [];
  assert(cityRoutePaths.includes('/'), "City route has '/' handler");
  assert(cityRoutePaths.includes('/:slug'), "City route has '/:slug' handler");

  // 3. Audit Brand Controller and Service Modules
  console.log('\n3. Auditing Brand Controller & Service Imports:');
  assert(typeof brandController.getBrands === 'function', 'brandController.getBrands is a function');
  assert(typeof brandController.getBrandBySlug === 'function', 'brandController.getBrandBySlug is a function');
  assert(typeof brandService.getBrands === 'function', 'brandService.getBrands is a function');
  assert(typeof brandService.getBrandBySlug === 'function', 'brandService.getBrandBySlug is a function');
  assert(typeof brandService.escapeRegex === 'function', 'brandService.escapeRegex utility is exported');

  // 4. Audit City Controller and Service Modules
  console.log('\n4. Auditing City Controller & Service Imports:');
  assert(typeof cityController.getCities === 'function', 'cityController.getCities is a function');
  assert(typeof cityController.getCityBySlug === 'function', 'cityController.getCityBySlug is a function');
  assert(typeof cityService.getCities === 'function', 'cityService.getCities is a function');
  assert(typeof cityService.getCityBySlug === 'function', 'cityService.getCityBySlug is a function');
  assert(typeof cityService.escapeRegex === 'function', 'cityService.escapeRegex utility is exported');

  // 5. Audit Validators
  console.log('\n5. Auditing Validator Functions:');
  assert(typeof brandValidator.validateBrandQuery === 'function', 'brandValidator.validateBrandQuery is a function');
  assert(typeof brandValidator.validateBrandSlug === 'function', 'brandValidator.validateBrandSlug is a function');
  assert(typeof cityValidator.validateCityQuery === 'function', 'cityValidator.validateCityQuery is a function');
  assert(typeof cityValidator.validateCitySlug === 'function', 'cityValidator.validateCitySlug is a function');

  // 6. Audit Route Registry Mounting
  console.log('\n6. Auditing Route Registry Mounting:');
  const mountedPathLayers = apiRoutes.stack
    ? apiRoutes.stack.filter((layer) => layer.name === 'router')
    : [];
  assert(mountedPathLayers.length >= 3, 'Central API router mounts at least 3 sub-routers (health, brands, cities)');

  // Start ephemeral HTTP server to test endpoints via Express
  console.log('\n7. Setting up Ephemeral HTTP Server for Integration Testing:');
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

  // 7. GET /api/brands is reachable through Express
  console.log('\n8. Auditing Reachability & Database-Safe Behavior of GET /api/brands:');
  const brandsRes = await makeRequest('/api/brands');
  // Without live DB, should return 503 cleanly with standardized response
  assert(
    (brandsRes.status === 503 && brandsRes.data.success === false) ||
      (brandsRes.status === 200 && brandsRes.data.success === true),
    `GET /api/brands responds through Express with status ${brandsRes.status} and safe structure`,
    JSON.stringify(brandsRes.data)
  );

  // 8. GET /api/cities is reachable through Express
  console.log('\n9. Auditing Reachability & Database-Safe Behavior of GET /api/cities:');
  const citiesRes = await makeRequest('/api/cities');
  assert(
    (citiesRes.status === 503 && citiesRes.data.success === false) ||
      (citiesRes.status === 200 && citiesRes.data.success === true),
    `GET /api/cities responds through Express with status ${citiesRes.status} and safe structure`,
    JSON.stringify(citiesRes.data)
  );

  // 9. GET /api/brands/:slug route exists and is reachable
  console.log('\n10. Auditing Reachability of GET /api/brands/:slug:');
  const brandSlugRes = await makeRequest('/api/brands/hero-motocorp');
  assert(
    brandSlugRes.status === 503 || brandSlugRes.status === 404 || brandSlugRes.status === 200,
    `GET /api/brands/:slug is reachable through Express (status: ${brandSlugRes.status})`
  );

  // 10. GET /api/cities/:slug route exists and is reachable
  console.log('\n11. Auditing Reachability of GET /api/cities/:slug:');
  const citySlugRes = await makeRequest('/api/cities/mumbai');
  assert(
    citySlugRes.status === 503 || citySlugRes.status === 404 || citySlugRes.status === 200,
    `GET /api/cities/:slug is reachable through Express (status: ${citySlugRes.status})`
  );

  // 11. Invalid pagination input is rejected
  console.log('\n12. Auditing Query Parameter Validation (Pagination & Operators):');
  const invalidPageRes = await makeRequest('/api/brands?page=-1');
  assert(
    invalidPageRes.status === 400 && invalidPageRes.data.success === false,
    'Negative page parameter is rejected with 400',
    JSON.stringify(invalidPageRes.data)
  );

  const invalidLimitRes = await makeRequest('/api/brands?limit=999');
  assert(
    invalidLimitRes.status === 400 && invalidLimitRes.data.success === false,
    'Limit parameter exceeding 100 is rejected with 400',
    JSON.stringify(invalidLimitRes.data)
  );

  const nonNumericPageRes = await makeRequest('/api/cities?page=abc');
  assert(
    nonNumericPageRes.status === 400 && nonNumericPageRes.data.success === false,
    'Non-integer page parameter is rejected with 400',
    JSON.stringify(nonNumericPageRes.data)
  );

  const operatorInjectionRes = await makeRequest('/api/brands?$where=1');
  assert(
    operatorInjectionRes.status === 400 && operatorInjectionRes.data.success === false,
    'Query parameter operator starting with $ is rejected with 400',
    JSON.stringify(operatorInjectionRes.data)
  );

  // 12. Invalid boolean filters are rejected
  console.log('\n13. Auditing Query Parameter Validation (Boolean Filters):');
  const invalidBrandActiveRes = await makeRequest('/api/brands?isActive=maybe');
  assert(
    invalidBrandActiveRes.status === 400 && invalidBrandActiveRes.data.success === false,
    "Invalid isActive value 'maybe' on brands is rejected with 400",
    JSON.stringify(invalidBrandActiveRes.data)
  );

  const invalidCityActiveRes = await makeRequest('/api/cities?isActive=123');
  assert(
    invalidCityActiveRes.status === 400 && invalidCityActiveRes.data.success === false,
    "Invalid isActive value '123' on cities is rejected with 400",
    JSON.stringify(invalidCityActiveRes.data)
  );

  // Invalid slug validation
  const invalidSlugRes = await makeRequest('/api/brands/bad--slug$$');
  assert(
    invalidSlugRes.status === 400 && invalidSlugRes.data.success === false,
    'Invalid URL characters in slug are rejected with 400'
  );

  // 13. Missing brand slug produces appropriate 404 behavior when database access is available/mocked
  console.log('\n14. Auditing 404 Behavior on Missing Brand Slug (Mocked DB State):');
  const origBrandFindOne = Brand.findOne;
  Brand._mockActive = true;
  Brand.findOne = () => ({
    select: () => ({
      lean: async () => null // Simulates no record found in DB
    })
  });

  const missingBrandRes = await makeRequest('/api/brands/non-existent-brand');
  assert(
    missingBrandRes.status === 404 &&
      missingBrandRes.data.success === false &&
      missingBrandRes.data.message === 'Brand not found',
    'Missing brand slug returns 404 with standardized error response',
    JSON.stringify(missingBrandRes.data)
  );

  // Restore Brand.findOne
  Brand.findOne = origBrandFindOne;
  delete Brand._mockActive;

  // 14. Missing city slug produces appropriate 404 behavior when database access is available/mocked
  console.log('\n15. Auditing 404 Behavior on Missing City Slug (Mocked DB State):');
  const origCityFindOne = City.findOne;
  City._mockActive = true;
  City.findOne = () => ({
    select: () => ({
      lean: async () => null // Simulates no record found in DB
    })
  });

  const missingCityRes = await makeRequest('/api/cities/non-existent-city');
  assert(
    missingCityRes.status === 404 &&
      missingCityRes.data.success === false &&
      missingCityRes.data.message === 'City not found',
    'Missing city slug returns 404 with standardized error response',
    JSON.stringify(missingCityRes.data)
  );

  // Restore City.findOne
  City.findOne = origCityFindOne;
  delete City._mockActive;

  // 15. Collection Response Pagination Metadata (Mocked DB State)
  console.log('\n16. Auditing Collection Responses & Pagination Metadata:');
  const origBrandFind = Brand.find;
  const origBrandCount = Brand.countDocuments;
  Brand._mockActive = true;
  Brand.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          select: () => ({
            lean: async () => [
              { name: 'Hero MotoCorp', slug: 'hero-motocorp', isActive: true, originCountry: 'India' }
            ]
          })
        })
      })
    })
  });
  Brand.countDocuments = async () => 1;

  const mockBrandRes = await makeRequest('/api/brands?page=1&limit=20');
  assert(
    mockBrandRes.status === 200 &&
      mockBrandRes.data.success === true &&
      Array.isArray(mockBrandRes.data.data) &&
      mockBrandRes.data.data.length === 1 &&
      mockBrandRes.data.meta &&
      mockBrandRes.data.meta.page === 1 &&
      mockBrandRes.data.meta.limit === 20 &&
      mockBrandRes.data.meta.total === 1 &&
      mockBrandRes.data.meta.pages === 1,
    'GET /api/brands returns standardized collection shape with pagination meta',
    JSON.stringify(mockBrandRes.data.meta)
  );

  Brand.find = origBrandFind;
  Brand.countDocuments = origBrandCount;
  delete Brand._mockActive;

  // City collection pagination test
  const origCityFind = City.find;
  const origCityCount = City.countDocuments;
  City._mockActive = true;
  City.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          select: () => ({
            lean: async () => [
              { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', tier: 'Metro', isActive: true }
            ]
          })
        })
      })
    })
  });
  City.countDocuments = async () => 1;

  const mockCityRes = await makeRequest('/api/cities?page=1&limit=20');
  assert(
    mockCityRes.status === 200 &&
      mockCityRes.data.success === true &&
      Array.isArray(mockCityRes.data.data) &&
      mockCityRes.data.data.length === 1 &&
      mockCityRes.data.meta &&
      mockCityRes.data.meta.page === 1 &&
      mockCityRes.data.meta.limit === 20 &&
      mockCityRes.data.meta.total === 1 &&
      mockCityRes.data.meta.pages === 1,
    'GET /api/cities returns standardized collection shape with pagination meta',
    JSON.stringify(mockCityRes.data.meta)
  );

  City.find = origCityFind;
  City.countDocuments = origCityCount;
  delete City._mockActive;

  // 16. Existing /api/health still passes
  console.log('\n17. Auditing Regression on /api/health:');
  const healthRes = await makeRequest('/api/health');
  assert(
    healthRes.status === 200 &&
      healthRes.data.success === true &&
      healthRes.data.message === 'Hero Showroom API is running',
    'Existing /api/health continues to pass with 200 OK',
    JSON.stringify(healthRes.data)
  );

  // Close ephemeral server
  server.close();

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 2 STEP 2A CATALOGUE API AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runStep2ATests().catch((err) => {
  console.error('Fatal error running Step 2A tests:', err);
  process.exit(1);
});
