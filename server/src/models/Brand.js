const mongoose = require('mongoose');

/**
 * Brand Schema
 * Foundation for automotive manufacturers, divisions, and sub-brands.
 */
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Brand slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    logo: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    originCountry: {
      type: String,
      trim: true,
      default: 'India'
    },
    website: {
      type: String,
      trim: true,
      default: ''
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

// Compound index for active brand alphabetical listing
brandSchema.index({ isActive: 1, name: 1 });

// Helpful compound/text indexes for discovery
brandSchema.index({ name: 'text', description: 'text' });

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);

module.exports = Brand;
