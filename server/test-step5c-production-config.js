const http = require('http');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const {
  validateConfig,
  getConfig,
  getJwtSecret,
  getJwtExpiresIn,
  ALLOWED_ENVIRONMENTS,
  INSECURE_JWT_SECRETS
} = require('./src/config/env');
const authConfig = require('./src/config/auth');
const { getCorsOptions, getDefaultAllowedOrigins } = require('./src/config/corsConfig');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');

async function runStep5cConfigTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 3 CONFIG & ENVIRONMENT AUDIT     ');
  console.log('================================================================\n');

  let checks = 0;
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    checks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  };

  // 1. Establish database connection
  console.log('1. Database Connection & Environment Baseline:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for Configuration verification');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Config test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body !== null) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const headers = {
        'Content-Type': 'application/json',
        'x-test-bypass': 'true',
        ...extraHeaders
      };
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: pathUrl,
          method,
          headers
        },
        (res) => {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(rawData);
            } catch (e) {
              json = null;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json,
              rawBody: rawData
            });
          });
        }
      );

      req.on('error', reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  // 3. Test 1: Required Environment Variable Validation
  console.log('\n3. Testing Required Environment Variable Validation:');
  const prodMissingDb = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: '',
      JWT_SECRET: 'super_secure_production_secret_32_chars'
    }
  });
  assert(prodMissingDb.valid === false, 'Production mode detects missing MONGODB_URI');
  assert(
    prodMissingDb.errors.some((e) => e.includes('MONGODB_URI is required in production')),
    'Missing MONGODB_URI error message is clear and non-leaking'
  );

  const prodMissingSecret = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: ''
    }
  });
  assert(prodMissingSecret.valid === false, 'Production mode detects missing JWT_SECRET');
  assert(
    prodMissingSecret.errors.some((e) => e.includes('JWT_SECRET is required')),
    'Missing JWT_SECRET error message is clear'
  );

  const prodValid = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: 'super_secure_production_secret_32_chars',
      PORT: '5000'
    }
  });
  assert(prodValid.valid === true, 'Production mode accepts fully valid production configuration');
  assert(prodValid.errors.length === 0, 'Valid production config produces zero errors');

  // 4. Test 2: NODE_ENV Handling
  console.log('\n4. Testing NODE_ENV Handling & Normalization:');
  const prodEnv = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'production' } });
  assert(prodEnv.config.isProduction === true, 'NODE_ENV=production sets isProduction=true');
  assert(prodEnv.config.isDevelopment === false, 'NODE_ENV=production sets isDevelopment=false');

  const devEnv = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'development' } });
  assert(devEnv.config.isDevelopment === true, 'NODE_ENV=development sets isDevelopment=true');

  const testEnv = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'test' } });
  assert(testEnv.config.isTest === true, 'NODE_ENV=test sets isTest=true');

  const invalidEnv = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'unknown_staging' } });
  assert(invalidEnv.valid === false, 'Invalid NODE_ENV string is flagged as validation error');
  assert(invalidEnv.config.nodeEnv === 'development', 'Invalid NODE_ENV safely falls back to development');

  // 5. Test 3: PORT Validation
  console.log('\n5. Testing PORT Parsing & Validation:');
  const customPort = validateConfig({ throwOnError: false, envOverrides: { PORT: '8080' } });
  assert(customPort.config.port === 8080, 'Valid numeric string PORT parsed correctly');

  const defaultPort = validateConfig({ throwOnError: false, envOverrides: { PORT: '' } });
  assert(defaultPort.config.port === 5000, 'Missing or empty PORT defaults to 5000');

  const invalidPortAlpha = validateConfig({ throwOnError: false, envOverrides: { PORT: 'invalid_port' } });
  assert(invalidPortAlpha.valid === false, 'Non-numeric PORT is rejected with validation error');

  const invalidPortNegative = validateConfig({ throwOnError: false, envOverrides: { PORT: '-10' } });
  assert(invalidPortNegative.valid === false, 'Negative PORT is rejected');

  const invalidPortOverflow = validateConfig({ throwOnError: false, envOverrides: { PORT: '70000' } });
  assert(invalidPortOverflow.valid === false, 'PORT > 65535 is rejected');

  // 6. Test 4: CLIENT_URL & CORS Handling
  console.log('\n6. Testing CLIENT_URL & CORS Allowed Origins Normalization:');
  const singleClient = validateConfig({
    throwOnError: false,
    envOverrides: { CLIENT_URL: 'https://hero-showroom.onrender.com' }
  });
  assert(
    singleClient.config.allowedOrigins.includes('https://hero-showroom.onrender.com'),
    'Single CLIENT_URL included in allowed origins'
  );

  const trailingSlashClient = validateConfig({
    throwOnError: false,
    envOverrides: { CLIENT_URL: 'https://hero-showroom.onrender.com/' }
  });
  assert(
    trailingSlashClient.config.allowedOrigins.includes('https://hero-showroom.onrender.com'),
    'Trailing slash on CLIENT_URL stripped for exact browser Origin matching'
  );

  const multiClient = validateConfig({
    throwOnError: false,
    envOverrides: { CLIENT_URL: 'https://site1.com, https://site2.com/' }
  });
  assert(multiClient.config.allowedOrigins.includes('https://site1.com'), 'Comma-separated site1 included');
  assert(multiClient.config.allowedOrigins.includes('https://site2.com'), 'Comma-separated site2 with slash normalized');

  const wildcardProd = validateConfig({
    throwOnError: false,
    envOverrides: { NODE_ENV: 'production', CLIENT_URL: '*' }
  });
  assert(wildcardProd.valid === false, 'Wildcard CLIENT_URL in production is rejected');

  // 7. Test 5: JWT Configuration Safety
  console.log('\n7. Testing JWT Secret Safety & Entropy Enforcements:');
  const shortSecretProd = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: 'short_key'
    }
  });
  assert(shortSecretProd.valid === false, 'Short JWT secret (< 16 chars) rejected in production');

  const placeholderSecretProd = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: 'your_jwt_secret_key_here'
    }
  });
  assert(placeholderSecretProd.valid === false, 'Default placeholder JWT secret rejected in production');

  const secureSecretProd = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: 'long_and_cryptographically_secure_secret_key_2026'
    }
  });
  assert(secureSecretProd.valid === true, 'Cryptographically strong JWT secret accepted in production');

  assert(authConfig.jwtExpiresIn === '7d' || typeof authConfig.jwtExpiresIn === 'string', 'JWT expiry is configured');
  assert(typeof authConfig.getJwtSecret() === 'string', 'authConfig.getJwtSecret() returns active secret');

  // 8. Test 6: Missing Required Configuration Fast Failure
  console.log('\n8. Testing Fast Failure on Missing Production Configuration:');
  let thrownError = null;
  try {
    validateConfig({
      throwOnError: true,
      envOverrides: {
        NODE_ENV: 'production',
        MONGODB_URI: '',
        JWT_SECRET: ''
      }
    });
  } catch (err) {
    thrownError = err;
  }
  assert(thrownError !== null, 'validateConfig({ throwOnError: true }) throws on invalid configuration');
  assert(thrownError && thrownError.name === 'ConfigValidationError', 'Throws ConfigValidationError instance');
  assert(!thrownError.message.includes('password'), 'Error message does not reveal secret credentials');

  // 9. Test 7: Production vs Development Rate Limits
  console.log('\n9. Testing Environment-Specific Rate Limit Profiles:');
  const devRateConfig = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'development' } });
  const prodRateConfig = validateConfig({ throwOnError: false, envOverrides: { NODE_ENV: 'production' } });
  assert(
    prodRateConfig.config.rateLimits.auth.max < devRateConfig.config.rateLimits.auth.max,
    'Production auth rate limit is stricter than development'
  );
  assert(
    prodRateConfig.config.rateLimits.generalApi.max < devRateConfig.config.rateLimits.generalApi.max,
    'Production general API rate limit is stricter than development'
  );

  // 10. Test 8: Client API Base URL Configuration Inspection
  console.log('\n10. Testing Client API URL Configuration & Source Files:');
  const clientApiPath = path.resolve(__dirname, '../client/src/services/api.js');
  assert(fs.existsSync(clientApiPath), 'Client api.js file exists');
  const clientApiContent = fs.readFileSync(clientApiPath, 'utf8');
  assert(
    clientApiContent.includes('import.meta.env.VITE_API_BASE_URL') ||
      clientApiContent.includes('import.meta.env.VITE_API_URL'),
    'Client API client is environment-variable driven'
  );

  // 11. Test 9: No Server Secrets in Client Codebase
  console.log('\n11. Auditing Client Code for Server Secret Leakage:');
  const clientSrcDir = path.resolve(__dirname, '../client/src');
  const findSecretsInDir = (dir) => {
    const files = fs.readdirSync(dir);
    let violations = 0;
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        violations += findSecretsInDir(fullPath);
      } else if (/\.(jsx?|tsx?|html|css|json)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('JWT_SECRET') || content.includes('MONGODB_URI') || content.includes('DATABASE_URL')) {
          violations++;
        }
      }
    }
    return violations;
  };
  const clientSecretLeaks = findSecretsInDir(clientSrcDir);
  assert(clientSecretLeaks === 0, 'Zero server secrets (JWT_SECRET, MONGODB_URI) in client/src/');

  // 12. Test 10: .env.example Hygiene & Placeholder Audit
  console.log('\n12. Auditing .env.example Template Hygiene:');
  const serverEnvExamplePath = path.resolve(__dirname, '.env.example');
  assert(fs.existsSync(serverEnvExamplePath), 'server/.env.example template exists');
  const serverEnvExample = fs.readFileSync(serverEnvExamplePath, 'utf8');
  assert(serverEnvExample.includes('MONGODB_URI='), 'server/.env.example has empty MONGODB_URI placeholder');
  assert(
    !serverEnvExample.includes('mongodb+srv://admin:') && !serverEnvExample.includes('mongodb+srv://root:'),
    'server/.env.example contains no real credentials'
  );

  const clientEnvExamplePath = path.resolve(__dirname, '../client/.env.example');
  assert(fs.existsSync(clientEnvExamplePath), 'client/.env.example template exists');
  const clientEnvExample = fs.readFileSync(clientEnvExamplePath, 'utf8');
  assert(
    !clientEnvExample.includes('JWT_SECRET') && !clientEnvExample.includes('MONGODB_URI'),
    'client/.env.example exposes zero server secrets'
  );

  // 13. Test 11: Gitignore Protection for .env Files
  console.log('\n13. Auditing .gitignore for Secrets Protection:');
  const rootGitignorePath = path.resolve(__dirname, '../.gitignore');
  assert(fs.existsSync(rootGitignorePath), 'Root .gitignore exists');
  const gitignoreContent = fs.readFileSync(rootGitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore ignores .env files');
  assert(gitignoreContent.includes('.env.*'), '.gitignore ignores .env.* variants');

  // Verify server/.env is not tracked in git
  const trackedFilesOutput = require('child_process').execSync('git ls-files', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8'
  });
  const trackedEnvFiles = trackedFilesOutput
    .split('\n')
    .filter((f) => f.endsWith('.env') || f.includes('.env.local'));
  assert(trackedEnvFiles.length === 0, 'No active .env files are tracked by Git (0 found)');

  // 14. Test 12: Startup Configuration & Server Health
  console.log('\n14. Testing Live Server Startup & Health:');
  const healthRes = await makeRequest('/api/health');
  assert(healthRes.statusCode === 200, 'GET /api/health responds with 200 OK');
  assert(healthRes.body && healthRes.body.success === true, 'Health response indicates success: true');
  assert(
    healthRes.body && healthRes.body.data && healthRes.body.data.database === 'connected',
    'Health response confirms database: connected'
  );

  // 15. Test 13: Security Hardening Remains Active
  console.log('\n15. Testing Security Hardening Middleware:');
  assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff is active');
  assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN is active');
  assert(healthRes.headers['x-powered-by'] === undefined, 'X-Powered-By is suppressed');

  // Universal sanitization test
  const operatorQueryRes = await makeRequest('/api/bikes?price[$gt]=0');
  assert(operatorQueryRes.statusCode === 400, 'Operator injection in query parameter ($gt) blocked with 400');

  // 16. Test 14: Error Handling Normalization Remains Active
  console.log('\n16. Testing Error Handling Normalization:');
  const notFoundRes = await makeRequest('/api/undefined-endpoint-xyz');
  assert(notFoundRes.statusCode === 404, 'Catch-all 404 handler returns 404');
  assert(notFoundRes.body && notFoundRes.body.success === false, '404 response has success: false');

  const malformedJsonRes = await makeRequest('/api/auth/login', 'POST', '{"bad-json');
  assert(malformedJsonRes.statusCode === 400, 'Malformed JSON returns 400');
  assert(
    malformedJsonRes.body && malformedJsonRes.body.message.includes('Malformed JSON payload'),
    'Malformed JSON returns normalized message'
  );

  // 17. Test 15: Actual Application Initialization & Fail-Fast Startup Validation
  console.log('\n17. Testing Actual Application Initialization & Fail-Fast Startup:');
  const appModulePath = require.resolve('./src/app');
  const envModulePath = require.resolve('./src/config/env');
  const corsModulePath = require.resolve('./src/config/corsConfig');

  const reloadAppWithEnv = (customEnv) => {
    const savedEnv = { ...process.env };
    delete require.cache[appModulePath];
    delete require.cache[envModulePath];
    delete require.cache[corsModulePath];

    for (const key of Object.keys(customEnv)) {
      if (customEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = customEnv[key];
      }
    }

    try {
      const reloadedApp = require('./src/app');
      return { success: true, app: reloadedApp, error: null };
    } catch (err) {
      return { success: false, app: null, error: err };
    } finally {
      for (const key of Object.keys(process.env)) {
        if (!(key in savedEnv)) {
          delete process.env[key];
        }
      }
      for (const [k, v] of Object.entries(savedEnv)) {
        process.env[k] = v;
      }
      delete require.cache[appModulePath];
      delete require.cache[envModulePath];
      delete require.cache[corsModulePath];
    }
  };

  // 1. Production + missing JWT_SECRET
  const missingJwtInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
    JWT_SECRET: undefined
  });
  assert(missingJwtInit.success === false, 'Production startup fails when JWT_SECRET is missing');
  assert(
    missingJwtInit.error && missingJwtInit.error.message.includes('JWT_SECRET is required'),
    'Missing JWT_SECRET produces clear configuration error'
  );

  // 2. Production + weak JWT_SECRET (< 16 chars)
  const weakSecretValue = 'short-secret';
  const weakJwtInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
    JWT_SECRET: weakSecretValue
  });
  assert(weakJwtInit.success === false, 'Production startup fails when JWT_SECRET is < 16 characters');
  assert(
    weakJwtInit.error && weakJwtInit.error.message.includes('at least 16 characters'),
    'Weak JWT_SECRET produces clear length requirement error'
  );

  // 3. Production + placeholder JWT_SECRET
  const placeholderSecret = 'your_jwt_secret_key_here';
  const placeholderJwtInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/prod',
    JWT_SECRET: placeholderSecret
  });
  assert(placeholderJwtInit.success === false, 'Production startup fails when JWT_SECRET is a placeholder');
  assert(
    placeholderJwtInit.error && placeholderJwtInit.error.message.includes('placeholder JWT_SECRET is not permitted'),
    'Placeholder JWT_SECRET produces clear rejection error'
  );

  // 4. Production + localhost MongoDB
  const localhostDbInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/hero_showroom',
    JWT_SECRET: 'a-secure-production-jwt-key-2025'
  });
  assert(localhostDbInit.success === false, 'Production startup fails when MONGODB_URI points to localhost');
  assert(
    localhostDbInit.error && localhostDbInit.error.message.includes('cannot point to localhost or 127.0.0.1'),
    'Localhost MongoDB URI in production produces clear rejection error'
  );

  // 5. Production + valid required configuration
  const validProdInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://cluster.mongodb.net/prod_db',
    JWT_SECRET: 'a-secure-production-jwt-key-2025',
    CLIENT_URL: 'https://hero-showroom.onrender.com'
  });
  assert(validProdInit.success === true, 'Production startup succeeds with valid required configuration');
  assert(validProdInit.app !== null, 'Loaded application instance is returned for valid production configuration');

  // 6. Development configuration succeeds
  const devInit = reloadAppWithEnv({
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/hero_showroom',
    JWT_SECRET: undefined
  });
  assert(devInit.success === true, 'Development configuration succeeds without error');

  // 7. Test configuration succeeds
  const testInit = reloadAppWithEnv({
    NODE_ENV: 'test',
    MONGODB_URI: undefined,
    JWT_SECRET: undefined
  });
  assert(testInit.success === true, 'Test configuration succeeds without error');

  // 8. No secret value appears in error output
  const sensitiveSecret = 'TopSecretEntropyValue98765';
  const sensitiveInit = reloadAppWithEnv({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/db',
    JWT_SECRET: sensitiveSecret
  });
  assert(sensitiveInit.success === false, 'Sensitive test fails on invalid configuration');
  assert(
    !sensitiveInit.error.message.includes(sensitiveSecret),
    'Sensitive JWT_SECRET is never echoed in error output'
  );
  assert(
    !sensitiveInit.error.message.includes('password'),
    'Credentials/passwords are never echoed in error output'
  );

  // 9. CORS consumes already-validated config directly
  const validatedMockConfig = { allowedOrigins: ['https://validated-origin.hero-showroom.com'] };
  const mockCorsOptions = getCorsOptions(validatedMockConfig);
  let originAllowed = false;
  mockCorsOptions.origin('https://validated-origin.hero-showroom.com', (err, allow) => {
    originAllowed = allow === true && err === null;
  });
  assert(originAllowed === true, 'CORS correctly consumes already-validated config object');
  assert(
    getDefaultAllowedOrigins(validatedMockConfig).includes('https://validated-origin.hero-showroom.com'),
    'getDefaultAllowedOrigins retrieves allowedOrigins directly from pre-validated config'
  );

  // 18. Teardown
  console.log('\n18. Teardown Ephemeral Test Server:');
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  assert(true, 'Ephemeral test server closed and database disconnected cleanly');

  // Summary
  console.log('\n================================================================');
  console.log(` AUDIT & TEST RESULT: ${passed} / ${checks} checks passed (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStep5cConfigTests().catch((err) => {
    console.error('Fatal configuration test error:', err);
    process.exit(1);
  });
}

module.exports = runStep5cConfigTests;
