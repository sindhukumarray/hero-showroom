const mongoose = require('mongoose');

/**
 * City Schema
 * Geographic foundation for localized showroom and dealer discovery.
 */
const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'City slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
      index: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    },
    tier: {
      type: String,
      enum: ['Metro', 'Tier 1', 'Tier 2', 'Tier 3'],
      default: 'Metro'
    },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
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

// Compound index for state and city lookups
citySchema.index({ state: 1, name: 1 });

const City = mongoose.models.City || mongoose.model('City', citySchema);

module.exports = City;
