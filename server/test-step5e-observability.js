const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const authConfig = require('./src/config/auth');
const logger = require('./src/utils/logger');
const { redact, redactString, isSensitiveKey } = require('./src/utils/redact');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');

async function runStep5eObservabilityTests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 5 OBSERVABILITY & LOGGING AUDIT   ');
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
    assert(isConnected(), 'Database connected successfully for Observability verification');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Observability test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const headers = { ...extraHeaders };
      if (body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const options = {
        hostname: '127.0.0.1',
        port,
        path: pathUrl,
        method,
        headers
      };

      const start = process.hrtime.bigint();
      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const durationMs = Number(end - start) / 1e6;
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
            rawBody: rawData,
            durationMs
          });
        });
      });

      req.on('error', (e) => reject(e));
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  // 3. Logger Abstraction Unit Tests
  console.log('\n3. Structured Logger Abstraction Tests:');
  assert(typeof logger.info === 'function', 'logger.info method exists');
  assert(typeof logger.warn === 'function', 'logger.warn method exists');
  assert(typeof logger.error === 'function', 'logger.error method exists');
  assert(typeof logger.debug === 'function', 'logger.debug method exists');

  // Verify logger sink captures structured entries
  const capturedLogs = [];
  logger.setTestSink((entry) => capturedLogs.push(entry));

  logger.info('Test info message', { requestId: 'req-test-1', foo: 'bar' });
  const lastInfo = capturedLogs[capturedLogs.length - 1];
  assert(lastInfo?.level === 'info', 'logger.info captures level "info"');
  assert(lastInfo?.message === 'Test info message', 'logger.info records message');
  assert(lastInfo?.requestId === 'req-test-1', 'logger extracts requestId to top-level property');
  assert(lastInfo?.context?.foo === 'bar', 'logger records context metadata');
  assert(typeof lastInfo?.timestamp === 'string', 'logger generates ISO timestamp');

  logger.warn('Test warning message', { requestId: 'req-test-2' });
  const lastWarn = capturedLogs[capturedLogs.length - 1];
  assert(lastWarn?.level === 'warn', 'logger.warn captures level "warn"');

  logger.error('Test error message', { requestId: 'req-test-3', errCode: 'E_FAIL' });
  const lastErr = capturedLogs[capturedLogs.length - 1];
  assert(lastErr?.level === 'error', 'logger.error captures level "error"');

  // 4. Sensitive Data Redaction Utility Tests
  console.log('\n4. Sensitive Data Redaction & Sanitization Tests:');

  // String redaction
  const mongoUriSample = 'Connecting to mongodb+srv://admin_user:SuperSecretPass123@cluster0.abcde.mongodb.net/hero_db?retryWrites=true';
  const redactedUri = redactString(mongoUriSample);
  assert(!redactedUri.includes('SuperSecretPass123'), 'redactString completely masks MongoDB passwords');
  assert(redactedUri.includes('mongodb://<sanitized-uri>'), 'redactString substitutes normalized URI placeholder');

  const rawTokenSample = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature';
  const redactedToken = redactString(rawTokenSample);
  assert(!redactedToken.includes('doNotLeakThisSignature'), 'redactString redacts Bearer JWT signatures');
  assert(redactedToken.includes('[REDACTED]'), 'redactString replaces Bearer token with [REDACTED]');

  // Object key redaction
  assert(isSensitiveKey('password'), 'isSensitiveKey identifies "password"');
  assert(isSensitiveKey('passwordHash'), 'isSensitiveKey identifies "passwordHash"');
  assert(isSensitiveKey('accessToken'), 'isSensitiveKey identifies "accessToken"');
  assert(isSensitiveKey('refreshToken'), 'isSensitiveKey identifies "refreshToken"');
  assert(isSensitiveKey('apiKey'), 'isSensitiveKey identifies "apiKey"');
  assert(isSensitiveKey('authorization'), 'isSensitiveKey identifies "authorization"');
  assert(isSensitiveKey('cookie'), 'isSensitiveKey identifies "cookie"');
  assert(isSensitiveKey('jwtSecret'), 'isSensitiveKey identifies "jwtSecret"');
  assert(!isSensitiveKey('username'), 'isSensitiveKey preserves non-sensitive "username"');
  assert(!isSensitiveKey('name'), 'isSensitiveKey preserves non-sensitive "name"');

  const sensitivePayload = {
    user: 'er_sindhu',
    password: 'PlainTextPassword123!',
    accessToken: 'eyJhbGciOi...sample',
    nested: {
      refreshToken: 'secret_refresh_token',
      apiKey: 'api-key-999',
      safeField: 'active'
    },
    cookies: ['session=abc12345'],
    unrelatedList: [1, 2, 3]
  };

  const sanitizedObject = redact(sensitivePayload);
  assert(sanitizedObject.user === 'er_sindhu', 'redact preserves safe public properties');
  assert(sanitizedObject.password === '[REDACTED]', 'redact masks password with [REDACTED]');
  assert(sanitizedObject.accessToken === '[REDACTED]', 'redact masks accessToken with [REDACTED]');
  assert(sanitizedObject.nested.refreshToken === '[REDACTED]', 'redact masks deeply nested refreshToken');
  assert(sanitizedObject.nested.apiKey === '[REDACTED]', 'redact masks deeply nested apiKey');
  assert(sanitizedObject.nested.safeField === 'active', 'redact preserves nested non-sensitive fields');
  assert(sanitizedObject.cookies === '[REDACTED]', 'redact masks cookies array/field');

  // Redaction handles circular references safely without throwing
  const circularObj = { name: 'cyclic' };
  circularObj.self = circularObj;
  let circularResult = null;
  try {
    circularResult = redact(circularObj);
  } catch (e) {
    circularResult = null;
  }
  assert(circularResult !== null, 'redact handles circular references without throwing');
  assert(circularResult?.self === '[Circular]', 'redact marks circular references as [Circular]');

  // 5. Request Correlation ID Middleware Tests
  console.log('\n5. Request Correlation ID (X-Request-ID) Tests:');

  // 5a. Request generates UUID if none provided
  capturedLogs.length = 0;
  const resNoId = await makeRequest('/api/bikes?limit=1');
  assert(resNoId.statusCode === 200, 'GET /api/bikes succeeds');
  const generatedId = resNoId.headers['x-request-id'];
  assert(typeof generatedId === 'string' && generatedId.length >= 16, 'Response header X-Request-ID exists and is populated');
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(generatedId), 'Generated X-Request-ID is valid UUID format');

  // 5b. Request preserves safe incoming correlation ID
  const customTraceId = 'trace-gw-abc-12345678';
  const resWithId = await makeRequest('/api/bikes?limit=1', 'GET', null, {
    'X-Request-ID': customTraceId
  });
  assert(resWithId.statusCode === 200, 'GET /api/bikes with custom X-Request-ID succeeds');
  assert(resWithId.headers['x-request-id'] === customTraceId, 'Incoming safe X-Request-ID is preserved in response header');

  // 5c. Request sanitizes unsafe/malformed correlation ID (spaces, script injection, special characters)
  const unsafeTraceId = 'bad trace id <script>alert(1)</script>';
  const resUnsafeId = await makeRequest('/api/bikes?limit=1', 'GET', null, {
    'X-Request-ID': unsafeTraceId
  });
  assert(resUnsafeId.statusCode === 200, 'Request with unsafe X-Request-ID succeeds safely');
  const sanitizedAssignedId = resUnsafeId.headers['x-request-id'];
  assert(sanitizedAssignedId !== unsafeTraceId, 'Unsafe X-Request-ID is rejected and not echoed back');
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitizedAssignedId), 'Replaced with secure fresh UUID');

  // 6. Request Lifecycle Logging Middleware Tests
  console.log('\n6. Request Lifecycle Logging Tests:');

  capturedLogs.length = 0;
  const testTraceId = 'trace-lifecycle-check-999';
  const resLifecycle = await makeRequest('/api/brands?limit=1', 'GET', null, {
    'X-Request-ID': testTraceId
  });
  assert(resLifecycle.statusCode === 200, 'GET /api/brands returns 200 OK');

  const lifecycleLog = capturedLogs.find((l) => l.requestId === testTraceId);
  assert(lifecycleLog !== undefined, 'Request lifecycle log was emitted for request');
  assert(lifecycleLog?.level === 'info', 'Successful 200 request logged at level "info"');
  assert(lifecycleLog?.context?.method === 'GET', 'Lifecycle log includes method: GET');
  assert(lifecycleLog?.context?.url?.startsWith('/api/brands'), 'Lifecycle log includes normalized url');
  assert(lifecycleLog?.context?.statusCode === 200, 'Lifecycle log includes statusCode: 200');
  assert(typeof lifecycleLog?.context?.durationMs === 'number', 'Lifecycle log includes numeric durationMs');
  assert(lifecycleLog?.context?.durationMs >= 0, 'Lifecycle log duration is non-negative');
  assert(typeof lifecycleLog?.context?.environment === 'string', 'Lifecycle log includes environment');

  // 7. Health Check Noise Suppression Tests
  console.log('\n7. Health Check Noise Suppression Tests:');

  capturedLogs.length = 0;
  const healthTraceId = 'health-check-trace-111';
  const resHealth = await makeRequest('/api/health', 'GET', null, {
    'X-Request-ID': healthTraceId
  });
  assert(resHealth.statusCode === 200, 'GET /api/health responds with 200 OK');
  assert(resHealth.headers['x-request-id'] === healthTraceId, 'Health endpoint carries correlation ID');

  const healthLog = capturedLogs.find((l) => l.requestId === healthTraceId);
  // Health checks should be logged at debug level to avoid polluting production log aggregation
  assert(healthLog?.level === 'debug', 'Health check is logged at "debug" level to suppress production noise');

  // 8. Error Diagnostics & Correlation Tests
  console.log('\n8. Error Diagnostics & Correlation Tests:');

  // 8a. 404 Route Not Found
  capturedLogs.length = 0;
  const notFoundTraceId = 'notfound-trace-404-xyz';
  const res404 = await makeRequest('/api/unknown-route-12345', 'GET', null, {
    'X-Request-ID': notFoundTraceId
  });
  assert(res404.statusCode === 404, 'Unknown route returns 404');
  assert(res404.headers['x-request-id'] === notFoundTraceId, '404 error response includes X-Request-ID header');

  const errLog404 = capturedLogs.find((l) => l.requestId === notFoundTraceId && l.context?.statusCode === 404);
  assert(errLog404 !== undefined, 'Error log includes requestId matching correlation header');
  assert(errLog404?.context?.method === 'GET', 'Error log includes method');
  assert(errLog404?.context?.path === '/api/unknown-route-12345', 'Error log includes path');

  // 8b. 400 Validation Error
  capturedLogs.length = 0;
  const validationTraceId = 'validation-trace-400-abc';
  const res400 = await makeRequest('/api/bikes?limit=9999', 'GET', null, {
    'X-Request-ID': validationTraceId
  });
  assert(res400.statusCode === 400, 'Invalid limit returns 400');
  assert(res400.headers['x-request-id'] === validationTraceId, '400 response includes X-Request-ID header');

  const valLog = capturedLogs.find((l) => l.requestId === validationTraceId);
  assert(valLog !== undefined, 'Validation failure is logged with matching correlation ID');
  assert(valLog?.context?.statusCode === 400, 'Validation log records 400 status');

  // 8c. Malformed JSON Body (Express SyntaxError)
  capturedLogs.length = 0;
  const jsonTraceId = 'json-syntax-trace-888';
  const resBadJson = await makeRequest('/api/auth/login', 'POST', '{ malformed json: true ', {
    'X-Request-ID': jsonTraceId
  });
  assert(resBadJson.statusCode === 400, 'Malformed JSON returns 400');
  assert(resBadJson.headers['x-request-id'] === jsonTraceId, 'Malformed JSON response includes X-Request-ID header');
  assert(resBadJson.body?.message?.includes('Malformed JSON payload'), 'Normalized error message preserved');

  // 8d. 401 Authentication Failure
  capturedLogs.length = 0;
  const authTraceId = 'auth-trace-401-login';
  const res401 = await makeRequest('/api/leads/my', 'GET', null, {
    'X-Request-ID': authTraceId
  });
  assert(res401.statusCode === 401, 'Unauthenticated access returns 401');
  assert(res401.headers['x-request-id'] === authTraceId, '401 response preserves X-Request-ID');

  // 9. Credentials & Secrets Never Leaked in Logs
  console.log('\n9. Secrets & Credentials Zero-Leakage Audit:');

  capturedLogs.length = 0;
  const loginTraceId = 'login-leak-check-001';
  // Send login attempt with plaintext password
  await makeRequest('/api/auth/login', 'POST', {
    email: 'nonexistent_user@example.com',
    password: 'SuperSecretUserPassword999!'
  }, {
    'X-Request-ID': loginTraceId
  });

  const allCapturedText = JSON.stringify(capturedLogs);
  assert(!allCapturedText.includes('SuperSecretUserPassword999!'), 'User password is NEVER logged in request lifecycle or error logs');

  // Test error logging with simulated sensitive context
  logger.error('Database connection failed', {
    requestId: 'db-err-1',
    connectionString: 'mongodb://admin:DbSecretPass987@localhost:27017/hero',
    apiKey: 'sk-proj-supersecretkey123',
    token: 'jwt-token-sample-value'
  });

  const lastDbErr = capturedLogs[capturedLogs.length - 1];
  assert(!JSON.stringify(lastDbErr).includes('DbSecretPass987'), 'Database credentials never logged in context');
  assert(lastDbErr?.context?.apiKey === '[REDACTED]', 'apiKey redacted in logger context');
  assert(lastDbErr?.context?.token === '[REDACTED]', 'token redacted in logger context');

  // 10. CORS Configuration for X-Request-ID
  console.log('\n10. CORS Header Exposure & Permissions:');
  const resCors = await makeRequest('/api/health', 'OPTIONS', null, {
    Origin: 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'X-Request-ID, Content-Type'
  });
  assert(resCors.statusCode === 204 || resCors.statusCode === 200, 'CORS preflight succeeds');
  const exposedHeaders = resCors.headers['access-control-expose-headers'] || '';
  assert(exposedHeaders.toLowerCase().includes('x-request-id'), 'CORS exposes X-Request-ID to frontend clients');

  // 11. Existing Functionality & Response Contracts Intact
  console.log('\n11. Regression Verification of Response Contracts:');

  const resBikes = await makeRequest('/api/bikes');
  assert(resBikes.statusCode === 200, 'GET /api/bikes returns 200');
  assert(resBikes.body?.success === true, 'GET /api/bikes retains success: true contract');
  assert(Array.isArray(resBikes.body?.data), 'GET /api/bikes retains data array contract');
  assert(typeof resBikes.body?.meta?.total === 'number', 'GET /api/bikes retains meta.total');
  assert(Boolean(resBikes.headers['x-request-id']), 'GET /api/bikes response carries X-Request-ID');

  const resShowrooms = await makeRequest('/api/showrooms');
  assert(resShowrooms.statusCode === 200, 'GET /api/showrooms returns 200');
  assert(resShowrooms.body?.success === true, 'GET /api/showrooms retains success: true');
  assert(Boolean(resShowrooms.headers['x-request-id']), 'GET /api/showrooms carries X-Request-ID');

  // 12. Clean Teardown
  console.log('\n12. Teardown:');
  logger.setTestSink(null);
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  assert(true, 'Ephemeral server closed, database disconnected, and logger sink detached cleanly');

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed}/${checks} checks passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep5eObservabilityTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
