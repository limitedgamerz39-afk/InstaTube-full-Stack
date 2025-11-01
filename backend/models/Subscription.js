import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'stripe', 'razorpay', 'demo'],
      default: 'demo',
    },
    transactionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
