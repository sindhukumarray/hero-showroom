const mongoose = require('mongoose');
const { ALLOWED_FAVORITE_TYPES, FAVORITE_TYPES } = require('../constants/favorites');

/**
 * Favorite Schema
 * Represents a customer's saved/wishlisted bike or showroom.
 * Each document is a unique (user, entityType, entityId) triple.
 */
const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    entityType: {
      type: String,
      enum: {
        values: ALLOWED_FAVORITE_TYPES,
        message: '{VALUE} is not a valid favorite entity type'
      },
      required: [true, 'Entity type is required'],
      index: true
    },
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      default: null,
      index: true
    },
    showroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showroom',
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: one entry per user per entity — prevents duplicate favorites
favoriteSchema.index({ user: 1, entityType: 1, bike: 1 }, { unique: true, sparse: true, partialFilterExpression: { entityType: FAVORITE_TYPES.BIKE } });
favoriteSchema.index({ user: 1, entityType: 1, showroom: 1 }, { unique: true, sparse: true, partialFilterExpression: { entityType: FAVORITE_TYPES.SHOWROOM } });

// Chronological querying by user
favoriteSchema.index({ user: 1, createdAt: -1 });

// Omit internal Mongoose versioning from API responses
favoriteSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
