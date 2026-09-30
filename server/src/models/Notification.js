const mongoose = require('mongoose');
const { ALLOWED_NOTIFICATION_TYPES } = require('../constants/notifications');

/**
 * Notification Schema
 * Represents customer notifications generated from lifecycle events across the platform
 * (dealership enquiries, test ride bookings, offer claims, reviews, and system alerts).
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ALLOWED_NOTIFICATION_TYPES,
        message: '{VALUE} is not a supported notification type'
      },
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Notification title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Notification message cannot exceed 1000 characters']
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    relatedEntityType: {
      type: String,
      trim: true,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-performance notification retrieval and filtering
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });

// Clean JSON representation
notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;
