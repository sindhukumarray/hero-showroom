const mongoose = require('mongoose');
const { ALLOWED_REVIEW_STATUS, REVIEW_STATUS, REVIEW_RATING } = require('../constants/reviews');

/**
 * Review Schema
 * Represents a customer's rating and written review for a showroom.
 * Compound unique index enforces one review per user per showroom.
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    showroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showroom',
      required: [true, 'Showroom reference is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [REVIEW_RATING.MIN, `Rating must be at least ${REVIEW_RATING.MIN}`],
      max: [REVIEW_RATING.MAX, `Rating cannot exceed ${REVIEW_RATING.MAX}`],
      validate: {
        validator: (v) => Number.isInteger(v),
        message: 'Rating must be a whole number'
      }
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
      default: ''
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_REVIEW_STATUS,
        message: '{VALUE} is not a valid review status'
      },
      default: REVIEW_STATUS.PENDING,
      index: true
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Moderation note cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Enforce one review per user per showroom
reviewSchema.index({ user: 1, showroom: 1 }, { unique: true });

// Efficient public listing: showroom + status + newest first
reviewSchema.index({ showroom: 1, status: 1, createdAt: -1 });

// User's own review history
reviewSchema.index({ user: 1, createdAt: -1 });

// Admin moderation queue
reviewSchema.index({ status: 1, createdAt: -1 });

// Omit internal versioning from JSON API responses
reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;
