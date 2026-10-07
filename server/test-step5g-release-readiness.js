const fs = require('fs');
const path = require('path');
const { validateConfig, INSECURE_JWT_SECRETS } = require('./src/config/env');
const { getCorsOptions } = require('./src/config/corsConfig');

console.log('================================================================');
console.log(' HERO SHOWROOM — PHASE 5 STEP 7 RELEASE READINESS AUDIT ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
};

// 1. Audit Client Configuration
try {
  console.log('1. Auditing Client Configuration:');
  const clientPath = path.resolve(__dirname, '../client');
  const vercelPath = path.join(clientPath, 'vercel.json');
  
  const hasVercelJson = fs.existsSync(vercelPath);
  assert(hasVercelJson, 'client/vercel.json exists for SPA routing');
  
  if (hasVercelJson) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    assert(
      vercelConfig.rewrites && vercelConfig.rewrites.some(r => r.source === '/(.*)' && r.destination === '/index.html'),
      'vercel.json contains SPA rewrite rule to /index.html'
    );
  }

  const clientEnvExample = fs.readFileSync(path.join(clientPath, '.env.example'), 'utf8');
  assert(!clientEnvExample.includes('VITE_API_URL=http://localhost'), '.env.example does not hardcode localhost without explanation');
  
} catch (e) {
  assert(false, `Client audit failed: ${e.message}`);
}
console.log();

// 2. Audit Server Configuration
try {
  console.log('2. Auditing Server Configuration:');
  const serverPkg = require('./package.json');
  assert(serverPkg.scripts.start === 'node src/server.js', 'package.json start script correctly targets node src/server.js');
  
  const serverEnvExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  assert(!serverEnvExample.includes('mongodb+srv://admin:password'), '.env.example does not expose real MongoDB credentials');
  
  const gitignore = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8');
  assert(gitignore.includes('.env'), '.gitignore properly ignores .env files');
  
} catch (e) {
  assert(false, `Server audit failed: ${e.message}`);
}
console.log();

// 3. Audit Environment Configuration Safeguards
try {
  console.log('3. Auditing Environment Safeguards:');
  const prodConfig = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://test:test@cluster.mongodb.net/test',
      JWT_SECRET: 'this_is_a_safe_and_long_jwt_secret_for_production'
    }
  });
  assert(prodConfig.valid, 'Production config passes validation with valid MONGODB_URI and secure JWT_SECRET');

  const invalidProdConfig = validateConfig({
    throwOnError: false,
    envOverrides: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost:27017/test', // localhost not allowed
      JWT_SECRET: '12345678' // insecure and too short
    }
  });
  assert(!invalidProdConfig.valid, 'Production config correctly rejects localhost MONGODB_URI and insecure JWT_SECRET');
  assert(
    invalidProdConfig.errors.some(e => e.includes('localhost') || e.includes('127.0.0.1')),
    'Validation explicitly flags localhost MONGODB_URI in production'
  );
  assert(
    invalidProdConfig.errors.some(e => e.includes('cryptographic safety')),
    'Validation explicitly flags short JWT_SECRET in production'
  );

  const corsOpts = getCorsOptions({ allowedOrigins: ['https://hero-showroom-client.vercel.app'] });
  assert(Array.isArray(corsOpts.allowedHeaders) && corsOpts.allowedHeaders.includes('Authorization'), 'CORS exposes Authorization header properly');
  
} catch (e) {
  assert(false, `Environment audit failed: ${e.message}`);
}
console.log();

console.log('================================================================');
console.log(` SUMMARY: ${passCount + failCount} CHECKS TOTAL`);
console.log(` PASSED:  ${passCount}`);
console.log(` FAILED:  ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
