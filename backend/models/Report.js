import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedType: {
    type: String,
    enum: ['post', 'comment', 'user', 'story', 'message'],
    required: true,
  },
  reportedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
  actionTaken: {
    type: String,
    enum: ['none', 'removed', 'warning', 'suspended', 'banned'],
    default: 'none',
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
reportSchema.index({ reporter: 1 });
reportSchema.index({ reportedType: 1, status: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;