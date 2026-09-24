const mongoose = require('mongoose');
const { ALLOWED_ROLES, ROLES } = require('../constants/roles');

/**
 * User Schema
 * Manages user accounts, credentials hash, roles, and status for authentication.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ALLOWED_ROLES,
        message: '{VALUE} is not a valid user role'
      },
      default: ROLES.CUSTOMER,
      trim: true
    },
    phone: {
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

// Ensure passwordHash is omitted from default JSON transformations
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
