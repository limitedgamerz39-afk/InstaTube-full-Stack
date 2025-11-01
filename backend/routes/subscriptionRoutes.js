import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// @route   GET /api/subscription/plans
// @desc    Get subscription plans
// @access  Public
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'monthly',
      name: 'Premium Monthly',
      price: 9.99,
      currency: 'USD',
      features: [
        'Ad-free experience',
        'Background playback',
        'Download videos for offline viewing',
        'Early access to new features',
        'Priority customer support'
      ],
    },
    {
      id: 'yearly',
      name: 'Premium Yearly',
      price: 99.99,
      currency: 'USD',
      savings: 20,
      features: [
        'All Monthly features',
        'Save 2 months (20% off)',
        'Exclusive yearly subscriber badge',
        'Premium content library access'
      ],
    },
  ];

  res.json({ success: true, data: plans });
});

// @route   POST /api/subscription/subscribe
// @desc    Subscribe to premium (demo mode - no real payment)
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const amount = plan === 'monthly' ? 9.99 : 99.99;
    const durationMonths = plan === 'monthly' ? 1 : 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Create subscription record
    const subscription = await Subscription.create({
      user: req.user._id,
      plan,
      status: 'active',
      amount,
      expiresAt,
      paymentMethod: 'demo',
      transactionId: `DEMO_${Date.now()}`,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      isPremium: true,
      premiumSince: new Date(),
      premiumExpiresAt: expiresAt,
      premiumPlan: plan,
    });

    res.json({
      success: true,
      message: 'Premium subscription activated!',
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/subscription/cancel
// @desc    Cancel premium subscription
// @access  Private
router.post('/cancel', protect, async (req, res) => {
  try {
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    // Update subscription
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Note: User keeps premium until expiration date
    res.json({
      success: true,
      message: 'Subscription cancelled. Premium benefits will continue until ' + subscription.expiresAt.toLocaleDateString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/subscription/status
// @desc    Get user's subscription status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    }).sort('-createdAt');

    const user = await User.findById(req.user._id).select('isPremium premiumPlan premiumExpiresAt premiumSince');

    res.json({
      success: true,
      data: {
        isPremium: user.isPremium,
        plan: user.premiumPlan,
        expiresAt: user.premiumExpiresAt,
        since: user.premiumSince,
        subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
