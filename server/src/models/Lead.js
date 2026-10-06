const mongoose = require('mongoose');
const { ALLOWED_LEAD_STATUS, LEAD_STATUS, ALLOWED_LEAD_SOURCES } = require('../constants/leads');

/**
 * Lead Schema
 * Represents customer enquiries generated during showroom and vehicle discovery.
 */
const leadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Lead contact name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
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
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null,
      index: true
    },
    source: {
      type: String,
      enum: {
        values: ALLOWED_LEAD_SOURCES,
        message: '{VALUE} is not a valid lead source'
      },
      default: 'showroom'
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_LEAD_STATUS,
        message: '{VALUE} is not a valid lead status'
      },
      default: LEAD_STATUS.NEW,
      index: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for chronological querying by user
leadSchema.index({ user: 1, createdAt: -1 });
leadSchema.index({ showroom: 1, status: 1 });
leadSchema.index({ bike: 1, status: 1 });
leadSchema.index({ status: 1, createdAt: -1 });

// Ensure internal versioning is omitted from JSON transformations
leadSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = Lead;
