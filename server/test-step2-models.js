const mongoose = require('mongoose');
const {
  Brand,
  City,
  Showroom,
  Bike,
  BikeVariant
} = require('./src/models');
const { connectDatabase } = require('./src/config/database');

async function runModelTests() {
  console.log('=====================================================');
  console.log('  HERO SHOWROOM — PHASE 2 STEP 1 MODEL LAYER AUDIT   ');
  console.log('=====================================================\n');

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

  // 1. Verify Models Imported
  console.log('1. Auditing Model Imports:');
  assert(Boolean(Brand), 'Brand model imported successfully');
  assert(Boolean(City), 'City model imported successfully');
  assert(Boolean(Showroom), 'Showroom model imported successfully');
  assert(Boolean(Bike), 'Bike model imported successfully');
  assert(Boolean(BikeVariant), 'BikeVariant model imported successfully');

  // 2. Verify Schemas Exist & Timestamps Enabled
  console.log('\n2. Auditing Schemas & Timestamps:');
  const models = [
    { name: 'Brand', model: Brand },
    { name: 'City', model: City },
    { name: 'Showroom', model: Showroom },
    { name: 'Bike', model: Bike },
    { name: 'BikeVariant', model: BikeVariant }
  ];

  for (const { name, model } of models) {
    assert(Boolean(model.schema), `${name} has valid Mongoose schema`);
    assert(model.schema.options.timestamps === true, `${name} has timestamps enabled`);
  }

  // 3. Verify Required Fields
  console.log('\n3. Auditing Required Fields:');
  assert(Brand.schema.path('name').isRequired, 'Brand.name is required');
  assert(Brand.schema.path('slug').isRequired, 'Brand.slug is required');

  assert(City.schema.path('name').isRequired, 'City.name is required');
  assert(City.schema.path('slug').isRequired, 'City.slug is required');
  assert(City.schema.path('state').isRequired, 'City.state is required');

  assert(Showroom.schema.path('name').isRequired, 'Showroom.name is required');
  assert(Showroom.schema.path('slug').isRequired, 'Showroom.slug is required');
  assert(Showroom.schema.path('brand').isRequired, 'Showroom.brand is required');
  assert(Showroom.schema.path('city').isRequired, 'Showroom.city is required');
  assert(Showroom.schema.path('address.fullAddress').isRequired, 'Showroom.address.fullAddress is required');
  assert(Showroom.schema.path('contact.phone').isRequired, 'Showroom.contact.phone is required');

  assert(Bike.schema.path('brand').isRequired, 'Bike.brand is required');
  assert(Bike.schema.path('name').isRequired, 'Bike.name is required');
  assert(Bike.schema.path('slug').isRequired, 'Bike.slug is required');
  assert(Bike.schema.path('category').isRequired, 'Bike.category is required');
  assert(Bike.schema.path('priceRange.minPrice').isRequired, 'Bike.priceRange.minPrice is required');
  assert(Bike.schema.path('priceRange.maxPrice').isRequired, 'Bike.priceRange.maxPrice is required');

  assert(BikeVariant.schema.path('bike').isRequired, 'BikeVariant.bike is required');
  assert(BikeVariant.schema.path('name').isRequired, 'BikeVariant.name is required');
  assert(BikeVariant.schema.path('slug').isRequired, 'BikeVariant.slug is required');
  assert(BikeVariant.schema.path('exShowroomPrice').isRequired, 'BikeVariant.exShowroomPrice is required');

  // 4. Verify Entity Relationships & ObjectId Types
  console.log('\n4. Auditing Entity Relationships (ObjectId references):');
  assert(Showroom.schema.path('brand').instance === 'ObjectId', 'Showroom.brand is an ObjectId');
  assert(Showroom.schema.path('brand').options.ref === 'Brand', "Showroom.brand references 'Brand'");

  assert(Showroom.schema.path('city').instance === 'ObjectId', 'Showroom.city is an ObjectId');
  assert(Showroom.schema.path('city').options.ref === 'City', "Showroom.city references 'City'");

  assert(Bike.schema.path('brand').instance === 'ObjectId', 'Bike.brand is an ObjectId');
  assert(Bike.schema.path('brand').options.ref === 'Brand', "Bike.brand references 'Brand'");

  assert(BikeVariant.schema.path('bike').instance === 'ObjectId', 'BikeVariant.bike is an ObjectId');
  assert(BikeVariant.schema.path('bike').options.ref === 'Bike', "BikeVariant.bike references 'Bike'");

  // 5. Verify Indexing Configurations
  console.log('\n5. Auditing Unique & Specialized Indexes:');
  assert(Brand.schema.path('slug').options.unique === true, 'Brand.slug has unique index configured');
  assert(City.schema.path('slug').options.unique === true, 'City.slug has unique index configured');
  assert(Showroom.schema.path('slug').options.unique === true, 'Showroom.slug has unique index configured');
  assert(Bike.schema.path('slug').options.unique === true, 'Bike.slug has unique index configured');

  const bikeVariantIndexes = BikeVariant.schema.indexes();
  const hasCompoundSlugIndex = bikeVariantIndexes.some(
    ([fields, opts]) => fields.bike === 1 && fields.slug === 1 && opts.unique === true
  );
  assert(hasCompoundSlugIndex, 'BikeVariant has compound unique index on { bike: 1, slug: 1 }');

  const showroomIndexes = Showroom.schema.indexes();
  const hasGeoIndex = showroomIndexes.some(([fields]) => fields.location === '2dsphere');
  assert(hasGeoIndex, "Showroom has '2dsphere' index for geospatial queries");

  // 6. Verify Database Connection Safety (No hardcoded credentials)
  console.log('\n6. Auditing Database Connection Safety:');
  delete process.env.MONGODB_URI;
  try {
    await connectDatabase();
    assert(false, 'connectDatabase should fail when MONGODB_URI is undefined');
  } catch (err) {
    assert(
      err.message.includes('MONGODB_URI is not defined'),
      'connectDatabase fails clearly with descriptive message when MONGODB_URI is missing'
    );
  }

  // Summary
  console.log('\n=====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${checks}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=====================================================');

  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 2 STEP 1 MODEL AUDITS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n🚨 AUDIT FAILED WITH ${failed} ERRORS\n`);
    process.exit(1);
  }
}

runModelTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
