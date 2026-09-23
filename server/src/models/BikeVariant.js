const mongoose = require('mongoose');

/**
 * Bike Variant Schema
 * Specific trims, pricing tiers, braking configurations, and colorways.
 */
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hexCode: { type: String, default: '#000000', trim: true },
    image: { type: String, default: '' }
  },
  { _id: false }
);

const bikeVariantSchema = new mongoose.Schema(
  {
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      required: [true, 'Bike reference is required'],
      index: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      index: true
    },
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
      maxlength: [100, 'Variant name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Variant slug is required'],
      lowercase: true,
      trim: true
    },
    exShowroomPrice: {
      type: Number,
      required: [true, 'Ex-showroom price is required'],
      min: [0, 'Price must be a positive number']
    },
    colors: {
      type: [colorSchema],
      default: []
    },
    keySpecifications: {
      kerbWeightKg: { type: Number, default: 0 },
      fuelCapacityLitres: { type: Number, default: 0 },
      seatHeightMm: { type: Number, default: 0 },
      groundClearanceMm: { type: Number, default: 0 }
    },
    keyFeatures: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Unique variant slug scoped to each bike model
bikeVariantSchema.index({ bike: 1, slug: 1 }, { unique: true });
bikeVariantSchema.index({ bike: 1, exShowroomPrice: 1 });

const BikeVariant = mongoose.models.BikeVariant || mongoose.model('BikeVariant', bikeVariantSchema);

module.exports = BikeVariant;
