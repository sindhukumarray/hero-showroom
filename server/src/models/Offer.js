const mongoose = require('mongoose');
const { ALLOWED_OFFER_TYPES, OFFER_TYPES } = require('../constants/offers');

/**
 * Offer Schema
 * Represents promotional offers, cashbacks, exchange bonuses, and special benefits for motorcycles.
 */
const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      minlength: [3, 'Offer title must be at least 3 characters long'],
      maxlength: [120, 'Offer title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      required: [true, 'Offer slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Offer description is required'],
      trim: true,
      maxlength: [1000, 'Offer description cannot exceed 1000 characters']
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
    showroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showroom',
      default: null,
      index: true
    },
    offerType: {
      type: String,
      enum: {
        values: ALLOWED_OFFER_TYPES,
        message: '{VALUE} is not a valid offer category'
      },
      required: [true, 'Offer type is required'],
      index: true,
      default: OFFER_TYPES.DISCOUNT
    },
    discountValue: {
      type: Number,
      min: [0, 'Discount value cannot be negative'],
      default: 0
    },
    benefits: {
      type: [String],
      default: []
    },
    terms: {
      type: String,
      trim: true,
      default: ''
    },
    validFrom: {
      type: Date,
      required: [true, 'Offer start date is required'],
      default: Date.now,
      index: true
    },
    validUntil: {
      type: Date,
      required: [true, 'Offer end date is required'],
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

// Compound indexes for high-performance catalogue queries
offerSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
offerSchema.index({ isActive: 1, createdAt: -1 });
offerSchema.index({ bike: 1, isActive: 1 });
offerSchema.index({ showroom: 1, isActive: 1 });
offerSchema.index({ offerType: 1, isActive: 1 });

// Ensure internal versioning is omitted from JSON transformations
offerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

module.exports = Offer;
