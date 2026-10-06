const mongoose = require('mongoose');

/**
 * Showroom Schema
 * Physical authorized dealership outlets, flagship lounges, and service locations.
 */
const showroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Showroom name is required'],
      trim: true,
      maxlength: [150, 'Showroom name cannot exceed 150 characters']
    },
    slug: {
      type: String,
      required: [true, 'Showroom slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City reference is required'],
      index: true
    },
    dealerName: {
      type: String,
      trim: true,
      default: ''
    },
    showroomType: {
      type: String,
      enum: ['Standard Dealership', 'Premia Flagship', 'Experience Center', 'Service Hub'],
      default: 'Standard Dealership'
    },
    address: {
      street: { type: String, trim: true, default: '' },
      area: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
      fullAddress: {
        type: String,
        required: [true, 'Full address is required'],
        trim: true
      }
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true
      },
      alternatePhone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      website: { type: String, trim: true, default: '' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      // [Longitude, Latitude] as per GeoJSON standards
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    openingHours: {
      displayText: { type: String, default: '9:00 AM - 8:00 PM' },
      daysOpen: { type: String, default: 'Monday to Sunday' }
    },
    facilities: {
      type: [String],
      default: ['Test Rides Available', 'Authorized Service']
    },
    images: {
      exterior: { type: String, default: '' },
      interior: { type: [String], default: [] }
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    isVerified: {
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

// Geospatial index for radius searches (sparse to allow default [0,0])
showroomSchema.index({ location: '2dsphere' }, { sparse: true });

// Compound indexes for querying by brand, city, rating, and creation date
showroomSchema.index({ city: 1, brand: 1, isActive: 1 });
showroomSchema.index({ city: 1, isActive: 1 });
showroomSchema.index({ isActive: 1, createdAt: -1 });
showroomSchema.index({ isActive: 1, 'rating.average': -1 });

const Showroom = mongoose.models.Showroom || mongoose.model('Showroom', showroomSchema);

module.exports = Showroom;
