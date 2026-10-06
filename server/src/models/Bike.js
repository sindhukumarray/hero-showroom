const mongoose = require('mongoose');

/**
 * Bike Schema
 * Master vehicle model for motorcycle catalogue and comparisons.
 */
const bikeSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Bike model name is required'],
      trim: true,
      maxlength: [120, 'Bike name cannot exceed 120 characters']
    },
    slug: {
      type: String,
      required: [true, 'Bike slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Bike category is required'],
      enum: ['Commuter', 'Sport', 'Cruiser', 'Tourer', 'Adventure', 'Scooter', 'Electric'],
      index: true
    },
    tagline: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      heroImage: { type: String, default: '' },
      gallery: { type: [String], default: [] }
    },
    engine: {
      displacementCc: { type: Number, min: 0, default: 0 },
      maxPower: { type: String, trim: true, default: '' },
      maxTorque: { type: String, trim: true, default: '' },
      cooling: {
        type: String,
        enum: ['Air Cooled', 'Liquid Cooled', 'Air/Oil Cooled', 'Electric Motor', 'Other'],
        default: 'Air Cooled'
      },
      emissionStandard: { type: String, default: 'BS6 Phase 2' }
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Electric', 'Hybrid'],
      default: 'Petrol',
      index: true
    },
    transmission: {
      type: String,
      default: 'Manual',
      trim: true
    },
    brakes: {
      front: { type: String, default: 'Disc' },
      rear: { type: String, default: 'Drum' },
      absType: { type: String, default: 'Single Channel ABS' }
    },
    mileage: {
      estimatedKmpl: { type: Number, min: 0, default: 0 },
      certifiedRangeKm: { type: Number, min: 0, default: 0 }
    },
    priceRange: {
      minPrice: {
        type: Number,
        required: [true, 'Minimum ex-showroom price is required'],
        min: 0
      },
      maxPrice: {
        type: Number,
        required: [true, 'Maximum ex-showroom price is required'],
        min: 0
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
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

// Compound indexes for catalogue sorting, filtering, and featured queries
bikeSchema.index({ category: 1, 'priceRange.minPrice': 1, isActive: 1 });
bikeSchema.index({ brand: 1, isActive: 1 });
bikeSchema.index({ isActive: 1, createdAt: -1 });
bikeSchema.index({ isFeatured: 1, isActive: 1 });
bikeSchema.index({ isActive: 1, 'priceRange.minPrice': 1 });

const Bike = mongoose.models.Bike || mongoose.model('Bike', bikeSchema);

module.exports = Bike;
