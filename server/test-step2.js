const http = require('http');
const express = require('express');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

async function runTests() {
  console.log('--- Step 2 Verification Test Suite ---');
  let failures = 0;

  // 1. Verify Database Config without MONGODB_URI
  delete process.env.MONGODB_URI;
  try {
    await connectDB();
    console.error('❌ DB Test Failed: connectDB should have thrown when MONGODB_URI is missing');
    failures++;
  } catch (err) {
    if (err.message.includes('MONGODB_URI is not defined')) {
      console.log('✅ DB Config Test: Successfully caught missing MONGODB_URI error');
    } else {
      console.error('❌ DB Config Test: Unexpected error message:', err.message);
      failures++;
    }
  }

  // 2. Start temporary HTTP server with Express app
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

  // Test /api/health
  try {
    const healthRes = await makeRequest('/api/health');
    if (
      healthRes.status === 200 &&
      healthRes.data.success === true &&
      healthRes.data.message === 'Hero Showroom API is running'
    ) {
      console.log('✅ /api/health Test: PASSED', JSON.stringify(healthRes.data));
    } else {
      console.error('❌ /api/health Test: FAILED', healthRes);
      failures++;
    }
  } catch (err) {
    console.error('❌ /api/health Request Error:', err);
    failures++;
  }

  // Test 404 Route
  try {
    const notFoundRes = await makeRequest('/api/non-existent-route');
    if (
      notFoundRes.status === 404 &&
      notFoundRes.data.success === false &&
      notFoundRes.data.message.includes('Route not found')
    ) {
      console.log('✅ 404 Handler Test: PASSED', JSON.stringify(notFoundRes.data));
    } else {
      console.error('❌ 404 Handler Test: FAILED', notFoundRes);
      failures++;
    }
  } catch (err) {
    console.error('❌ 404 Handler Request Error:', err);
    failures++;
  }

  // 3. Test Error Middleware with a test app
  const errApp = express();
  errApp.get('/test-error', (req, res, next) => {
    const err = new Error('Test internal failure');
    err.statusCode = 500;
    next(err);
  });
  errApp.use(errorHandler);

  const errServer = http.createServer(errApp);
  await new Promise((resolve) => errServer.listen(0, resolve));
  const errPort = errServer.address().port;

  try {
    const errorRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: errPort,
          path: '/test-error',
          method: 'GET'
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    if (errorRes.status === 500 && errorRes.data.success === false && errorRes.data.message === 'Test internal failure') {
      console.log('✅ Error Middleware Test: PASSED', JSON.stringify(errorRes.data));
    } else {
      console.error('❌ Error Middleware Test: FAILED', errorRes);
      failures++;
    }
  } catch (err) {
    console.error('❌ Error Middleware Test Request Error:', err);
    failures++;
  }

  server.close();
  errServer.close();

  if (failures === 0) {
    console.log('🎉 ALL STEP 2 CHECKS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error(`🚨 ${failures} CHECKS FAILED`);
    process.exit(1);
  }
}

runTests();
