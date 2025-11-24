import mongoose from 'mongoose';

const loginActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  success: {
    type: Boolean,
    required: true,
  },
  location: {
    country: String,
    region: String,
    city: String,
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'other'],
  },
  browser: String,
  os: String,
  twoFactorAttempt: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries
loginActivitySchema.index({ user: 1, timestamp: -1 });
loginActivitySchema.index({ ipAddress: 1 });
loginActivitySchema.index({ timestamp: -1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);

export default LoginActivity;