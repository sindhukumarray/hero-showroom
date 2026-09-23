import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase1IntegrationAudit() {
  console.log('=====================================================');
  console.log('  HERO SHOWROOM — PHASE 1 INTEGRATION & QUALITY AUDIT');
  console.log('=====================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  const assert = (condition, description) => {
    totalChecks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passedChecks++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failedChecks++;
    }
  };

  // --- 1. Architecture & Monorepo Structure ---
  console.log('1. Auditing Architecture & Directory Contracts:');
  const requiredDirectories = [
    'client/src/assets',
    'client/src/components',
    'client/src/constants',
    'client/src/hooks',
    'client/src/layouts',
    'client/src/pages',
    'client/src/routes',
    'client/src/services',
    'client/src/utils',
    'client/src/animations',
    'server/src/config',
    'server/src/controllers',
    'server/src/middleware',
    'server/src/models',
    'server/src/routes',
    'server/src/services',
    'server/src/validators',
    'server/src/utils'
  ];

  for (const dir of requiredDirectories) {
    const fullPath = path.resolve(__dirname, dir);
    assert(fs.existsSync(fullPath), `Directory exists: ${dir}`);
  }

  // --- 2. Environment Configurations ---
  console.log('\n2. Auditing Environment Templates & Safety:');
  const clientEnvExample = path.resolve(__dirname, 'client/.env.example');
  const serverEnvExample = path.resolve(__dirname, 'server/.env.example');
  const gitignorePath = path.resolve(__dirname, '.gitignore');

  assert(fs.existsSync(clientEnvExample), 'client/.env.example exists');
  const clientEnvContent = fs.readFileSync(clientEnvExample, 'utf-8');
  assert(clientEnvContent.includes('VITE_API_BASE_URL='), 'client/.env.example defines VITE_API_BASE_URL');

  assert(fs.existsSync(serverEnvExample), 'server/.env.example exists');
  const serverEnvContent = fs.readFileSync(serverEnvExample, 'utf-8');
  assert(serverEnvContent.includes('PORT='), 'server/.env.example defines PORT');
  assert(serverEnvContent.includes('MONGODB_URI='), 'server/.env.example defines MONGODB_URI');
  assert(serverEnvContent.includes('CLIENT_URL='), 'server/.env.example defines CLIENT_URL');

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  assert(gitignoreContent.includes('.env'), '.gitignore ignores raw .env files');
  assert(gitignoreContent.includes('!.env.example'), '.gitignore allows .env.example files');

  // Verify no real .env file is present or tracked
  assert(!fs.existsSync(path.resolve(__dirname, '.env')), 'No root .env leaked');
  assert(!fs.existsSync(path.resolve(__dirname, 'client/.env')), 'No client/.env leaked');
  assert(!fs.existsSync(path.resolve(__dirname, 'server/.env')), 'No server/.env leaked');

  // --- 3. Frontend Service & Axios Configuration ---
  console.log('\n3. Auditing Axios Client & API Base URL:');
  const apiServicePath = path.resolve(__dirname, 'client/src/services/api.js');
  const apiServiceContent = fs.readFileSync(apiServicePath, 'utf-8');
  assert(
    apiServiceContent.includes('VITE_API_BASE_URL'),
    'api.js respects VITE_API_BASE_URL environment variable'
  );
  assert(
    apiServiceContent.includes("baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api'"),
    'api.js has default fallback to http://localhost:5000/api'
  );

  // --- 4. Reusable UI Components System ---
  console.log('\n4. Auditing Reusable UI Component Library:');
  const requiredComponents = [
    'Container.jsx',
    'Section.jsx',
    'Button.jsx',
    'Card.jsx',
    'Badge.jsx',
    'Input.jsx',
    'Loading.jsx',
    'ErrorState.jsx',
    'EmptyState.jsx',
    'Header.jsx',
    'Footer.jsx',
    'index.js'
  ];
  for (const comp of requiredComponents) {
    assert(
      fs.existsSync(path.resolve(__dirname, 'client/src/components', comp)),
      `Component present: ${comp}`
    );
  }

  // --- 5. Routing Shells ---
  console.log('\n5. Auditing Frontend Page Shells & Routes:');
  const requiredPages = [
    'HomePage.jsx',
    'ShowroomsPage.jsx',
    'BikesPage.jsx',
    'ComparePage.jsx',
    'LoginPage.jsx',
    'RegisterPage.jsx',
    'DashboardPage.jsx',
    'AdminPage.jsx',
    'NotFoundPage.jsx'
  ];
  for (const page of requiredPages) {
    assert(
      fs.existsSync(path.resolve(__dirname, 'client/src/pages', page)),
      `Page shell exists: ${page}`
    );
  }

  const appRoutesPath = path.resolve(__dirname, 'client/src/routes/AppRoutes.jsx');
  const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf-8');
  assert(appRoutesContent.includes('path="showrooms"'), 'Route /showrooms registered');
  assert(appRoutesContent.includes('path="bikes"'), 'Route /bikes registered');
  assert(appRoutesContent.includes('path="compare"'), 'Route /compare registered');
  assert(appRoutesContent.includes('path="login"'), 'Route /login registered');
  assert(appRoutesContent.includes('path="register"'), 'Route /register registered');
  assert(appRoutesContent.includes('path="dashboard"'), 'Route /dashboard registered');
  assert(appRoutesContent.includes('path="admin"'), 'Route /admin registered');
  assert(appRoutesContent.includes('path="*"'), 'Catch-all 404 route registered');

  // --- 6. Backend Integration: Express App & Health Endpoint ---
  console.log('\n6. Auditing Backend Express Application & Health Endpoint:');
  const { default: app } = await import('./server/src/app.js').catch(async () => {
    // In case server is commonjs, load via createRequire
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    return { default: require('./server/src/app.js') };
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const testPort = server.address().port;

  const getResponse = (urlPath) =>
    new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${testPort}${urlPath}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (err) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        })
        .on('error', reject);
    });

  const healthRes = await getResponse('/api/health');
  assert(healthRes.status === 200, 'GET /api/health responds with status 200');
  assert(healthRes.body.success === true, 'GET /api/health returns success: true');
  assert(
    healthRes.body.message === 'Hero Showroom API is running',
    'GET /api/health message conforms to master PRD'
  );

  const notFoundRes = await getResponse('/api/non-existent-endpoint');
  assert(notFoundRes.status === 404, '404 handler responds with status 404');
  assert(notFoundRes.body.success === false, '404 handler returns success: false');

  await new Promise((resolve) => server.close(resolve));

  // --- 7. Final Summary ---
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${totalChecks}`);
  console.log(`PASSED: ${passedChecks}`);
  console.log(`FAILED: ${failedChecks}`);
  console.log('=====================================================');

  if (failedChecks === 0) {
    console.log('\n🎉 PHASE 1 FOUNDATION INTEGRATION AUDIT PASSED 100%!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failedChecks} ERRORS\n`);
    process.exit(1);
  }
}

runPhase1IntegrationAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
