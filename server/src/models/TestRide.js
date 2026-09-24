const mongoose = require('mongoose');
const { ALLOWED_TEST_RIDE_STATUS, TEST_RIDE_STATUS } = require('../constants/testRides');

/**
 * Test Ride Schema
 * Records customer test ride requests and appointment preferences.
 */
const testRideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    showroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showroom',
      required: [true, 'Showroom reference is required'],
      index: true
    },
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      required: [true, 'Bike reference is required'],
      index: true
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeVariant',
      default: null
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
      index: true
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_TEST_RIDE_STATUS,
        message: '{VALUE} is not a valid test ride status'
      },
      default: TEST_RIDE_STATUS.REQUESTED,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user history retrieval
testRideSchema.index({ user: 1, createdAt: -1 });
testRideSchema.index({ showroom: 1, preferredDate: 1, status: 1 });
testRideSchema.index({ bike: 1, status: 1 });

// Ensure internal versioning is omitted from JSON transformations
testRideSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const TestRide = mongoose.models.TestRide || mongoose.model('TestRide', testRideSchema);

module.exports = TestRide;
