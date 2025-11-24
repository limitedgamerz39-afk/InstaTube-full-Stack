import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'suspicious_login',
      'failed_login',
      'successful_login',
      'password_reset',
      'email_verification',
      '2fa_enabled',
      '2fa_disabled',
      'suspicious_file_upload',
      'malicious_content_detected',
      'account_locked',
      'account_unlocked',
      'role_changed',
      'account_banned',
      'account_unbanned',
      'admin_action'
    ],
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  userAgent: String,
  location: {
    country: String,
    region: String,
    city: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
securityLogSchema.index({ userId: 1, timestamp: -1 });
securityLogSchema.index({ eventType: 1 });
securityLogSchema.index({ severity: 1 });
securityLogSchema.index({ ipAddress: 1 });
securityLogSchema.index({ createdAt: -1 });

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

export default SecurityLog;