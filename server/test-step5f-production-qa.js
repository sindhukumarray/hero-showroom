const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDatabase, disconnectDatabase, isConnected } = require('./src/config/database');

async function runStep5fQATests() {
  console.log('================================================================');
  console.log(' HERO SHOWROOM — PHASE 5 STEP 6 PRODUCTION QA AUDIT             ');
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
  console.log('1. Verifying Database Connection:');
  try {
    await connectDatabase();
    assert(isConnected(), 'Database connected successfully for QA testing');
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Set up ephemeral HTTP server
  console.log('\n2. Setting up Ephemeral HTTP Server:');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  QA test server listening on http://127.0.0.1:${port}`);

  const makeRequest = (pathUrl, method = 'GET', body = null, extraHeaders = {}) => {
    return new Promise((resolve, reject) => {
      let postData = '';
      if (body !== null) {
        postData = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const headers = {
        'Content-Type': 'application/json',
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
            let parsed = null;
            try {
              parsed = JSON.parse(rawData);
            } catch (e) {
              parsed = rawData; // raw text if json parse fails
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
              raw: rawData
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

  try {
    // ==============================================================
    // 3. API Edge Cases (Malformed Data, Limits, 404s)
    // ==============================================================
    console.log('\n3. Testing Edge Cases & Global Handlers:');

    // Test 1: 404 Missing Route
    const res404 = await makeRequest('/api/this/route/does/not/exist');
    assert(res404.status === 404, 'Non-existent route returns 404');
    assert(typeof res404.body === 'object' && res404.body.success === false, '404 returns structured JSON error');

    // Test 2: Malformed JSON payload
    const resMalformed = await makeRequest('/api/auth/login', 'POST', '{ "email": "test@example.com", "password": "pass" '); // Missing closing brace
    assert(resMalformed.status === 400, 'Malformed JSON returns 400 Bad Request');
    
    let errMsg = '';
    if (typeof resMalformed.body === 'object' && resMalformed.body.message) {
      errMsg = resMalformed.body.message;
    } else if (typeof resMalformed.body === 'string') {
      errMsg = resMalformed.body;
    }
    assert(errMsg.includes('Malformed JSON payload'), 'Malformed JSON provides clear error message');

    // Test 3: Oversized Payload (if enforced by body-parser limit)
    // Generating a 1.5MB string
    const hugeString = 'A'.repeat(1500000);
    const resHuge = await makeRequest('/api/auth/login', 'POST', { email: 'test@test.com', password: hugeString });
    assert(resHuge.status === 413, 'Oversized payload returns 413 Payload Too Large');

    // Test 4: Invalid Query parameters
    // Ex. pagination limit exceeding bounds
    const resQuery = await makeRequest('/api/bikes?limit=1000');
    assert(resQuery.status === 200 || resQuery.status === 400, `Query limit check returns handled status code: ${resQuery.status}`);

    console.log('\n================================================================');
    console.log(` SUMMARY: ${passed}/${checks} checks passed (${failed} failed)`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
    await disconnectDatabase();
  }
}

runStep5fQATests().catch((err) => {
  console.error('Fatal error during QA testing:', err);
  process.exit(1);
});
