import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runStep4Verification() {
  console.log('--- Step 4 UI Component & Homepage Verification Test Suite ---');
  let failures = 0;

  // 1. Verify Reusable UI Components Exist
  const expectedComponents = [
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

  const componentsDir = path.resolve(__dirname, 'src/components');
  for (const comp of expectedComponents) {
    const compPath = path.resolve(componentsDir, comp);
    if (fs.existsSync(compPath)) {
      console.log(`✅ Component verified: ${comp}`);
    } else {
      console.error(`❌ Component missing: ${comp}`);
      failures++;
    }
  }

  // 2. Verify Homepage Foundation Sections
  const homePagePath = path.resolve(__dirname, 'src/pages/HomePage.jsx');
  const homeContent = fs.readFileSync(homePagePath, 'utf-8');

  const requiredSections = [
    { name: '1. Cinematic Hero', key: 'The Definitive' },
    { name: '2. Smart Search Shell', key: 'Search Directory' },
    { name: '3. Top Brands Section', key: 'Official Brand Divisions' },
    { name: '4. Popular Cities Section', key: 'Popular Dealer Cities' },
    { name: '5. Featured Bikes Section', key: 'Featured Motorcycles' },
    { name: '6. Featured Showrooms Section', key: 'Featured Showrooms' },
    { name: '7. Benefits Section', key: 'Built for the Discerning Rider' },
    { name: '8. Final CTA Section', key: 'Ready to Experience Official Dealership Excellence' }
  ];

  for (const sec of requiredSections) {
    if (homeContent.includes(sec.key)) {
      console.log(`✅ Homepage Section verified: ${sec.name}`);
    } else {
      console.error(`❌ Homepage Section missing: ${sec.name} (Key: ${sec.key})`);
      failures++;
    }
  }

  // 3. Verify Header and Footer Integration in RootLayout
  const rootLayoutContent = fs.readFileSync(path.resolve(__dirname, 'src/layouts/RootLayout.jsx'), 'utf-8');
  if (rootLayoutContent.includes('<Header') && rootLayoutContent.includes('<Footer')) {
    console.log('✅ Layout Integration: Header & Footer integrated in RootLayout');
  } else {
    console.error('❌ RootLayout missing Header or Footer');
    failures++;
  }

  if (failures === 0) {
    console.log('🎉 ALL STEP 4 STATIC CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error(`🚨 ${failures} STEP 4 CHECKS FAILED`);
    process.exit(1);
  }
}

runStep4Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
