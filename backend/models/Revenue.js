import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['ad_revenue', 'super_chat', 'shorts_fund', 'premium_views', 'subscription'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    liveStream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
    },
    description: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    month: {
      type: Number, // 1-12
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
revenueSchema.index({ creator: 1, isPaid: 1 });
revenueSchema.index({ month: 1, year: 1 });
revenueSchema.index({ source: 1 });

const Revenue = mongoose.model('Revenue', revenueSchema);

export default Revenue;
