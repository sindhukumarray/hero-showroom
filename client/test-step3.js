import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fadeIn,
  slideUp,
  heroHeadline,
  getAccessibleVariant
} from './src/animations/variants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runStep3Verification() {
  console.log('--- Step 3 Frontend Verification Test Suite ---');
  let failures = 0;

  // 1. Verify Production Build Outputs
  const distDir = path.resolve(__dirname, 'dist');
  const indexHtml = path.resolve(distDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('✅ Production Build: dist/index.html exists');
  } else {
    console.error('❌ Production Build: dist/index.html missing');
    failures++;
  }

  // 2. Verify Animation Variants & Reduced Motion Sanitizer
  const normalVariant = slideUp;
  const reducedVariant = getAccessibleVariant(slideUp, true);

  if (typeof normalVariant.visible === 'function') {
    const normalState = normalVariant.visible();
    const reducedState = reducedVariant.visible();

    if (normalState.y !== undefined && reducedState.y === undefined && reducedState.opacity === 1) {
      console.log('✅ Reduced Motion Test: Spatial translation (y) sanitized properly while preserving opacity');
    } else {
      console.error('❌ Reduced Motion Test Failed:', { normalState, reducedState });
      failures++;
    }
  }

  // 3. Verify Routes exist in AppRoutes.jsx
  const appRoutesContent = fs.readFileSync(path.resolve(__dirname, 'src/routes/AppRoutes.jsx'), 'utf-8');
  const requiredRoutes = ['/', 'showrooms', 'bikes', 'compare', 'login', 'register', 'dashboard', 'admin', '*'];
  let allRoutesPresent = true;
  for (const r of requiredRoutes) {
    if (!appRoutesContent.includes(`path="${r}"`) && !appRoutesContent.includes(`path='${r}'`) && !(r === '/' && appRoutesContent.includes('index'))) {
      console.error(`❌ Route check missing: ${r}`);
      allRoutesPresent = false;
      failures++;
    }
  }
  if (allRoutesPresent) {
    console.log('✅ Router Configuration: All 9 required routes and shells are declared in AppRoutes');
  }

  // 4. Verify Tailwind configuration and index.css
  const tailwindConfig = fs.readFileSync(path.resolve(__dirname, 'tailwind.config.js'), 'utf-8');
  const indexCss = fs.readFileSync(path.resolve(__dirname, 'src/index.css'), 'utf-8');

  if (tailwindConfig.includes('brand') && tailwindConfig.includes('background') && indexCss.includes('typography-display')) {
    console.log('✅ Design System & Typography Tokens: Tailwind tokens and fluid clamp classes defined');
  } else {
    console.error('❌ Design system tokens missing from configuration');
    failures++;
  }

  if (failures === 0) {
    console.log('🎉 ALL STEP 3 VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`🚨 ${failures} VERIFICATIONS FAILED`);
    process.exit(1);
  }
}

runStep3Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
