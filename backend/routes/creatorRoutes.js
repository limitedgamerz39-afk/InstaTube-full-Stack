import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Revenue from '../models/Revenue.js';
import Post from '../models/Post.js';

const router = express.Router();

// @route   POST /api/creator/enable-monetization
// @desc    Apply for creator monetization
// @access  Private
router.post('/enable-monetization', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check eligibility
    if (user.subscriber.length < 1000) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 1,000 subscriber to enable monetization',
      });
    }

    if (user.totalWatchTime < 4000) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 4,000 minutes of watch time in the last 12 months',
      });
    }

    user.isMonetizationEnabled = true;
    user.monetizationApproved = true; // Auto-approve for demo
    await user.save();

    res.json({
      success: true,
      message: 'Monetization enabled! You can now earn from your content.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/creator/analytics
// @desc    Get creator analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get revenue data
    const totalRevenue = await Revenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', false] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    // Get monthly revenue
    const monthlyRevenue = await Revenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Get revenue by source
    const revenueBySource = await Revenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Get top performing posts
    const topPosts = await Post.find({ author: req.user._id })
      .sort('-views')
      .limit(10)
      .select('title views likes category createdAt media');

    res.json({
      success: true,
      data: {
        overview: {
          totalEarnings: totalRevenue[0]?.total || 0,
          pendingPayout: totalRevenue[0]?.pending || 0,
          subscribers: user.subscribersCount,
          totalWatchTime: user.totalWatchTime,
          subscriber: user.subscriber.length,
        },
        monthlyRevenue,
        revenueBySource,
        topPosts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/creator/track-view
// @desc    Track video view for analytics (called from frontend)
// @access  Private
router.post('/track-view', protect, async (req, res) => {
  try {
    const { postId, watchTime } = req.body; // watchTime in seconds

    const post = await Post.findById(postId).populate('author');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Update post views
    post.views = (post.views || 0) + 1;
    await post.save();

    // Update creator's total watch time
    if (post.author) {
      await User.findByIdAndUpdate(post.author._id, {
        $inc: {
          totalWatchTime: Math.floor(watchTime / 60), // Convert to minutes
          totalShortViews: post.category === 'short' ? 1 : 0,
        },
      });

      // Calculate revenue (simplified - $0.001 per view for demo)
      if (post.author.monetizationApproved) {
        const revenue = 0.001; // $0.001 per view
        
        await Revenue.create({
          creator: post.author._id,
          source: post.category === 'short' ? 'shorts_fund' : 'ad_revenue',
          amount: revenue,
          post: post._id,
          description: `View on ${post.title}`,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });

        await User.findByIdAndUpdate(post.author._id, {
          $inc: {
            totalEarnings: revenue,
            pendingPayout: revenue,
            shortsEarnings: post.category === 'short' ? revenue : 0,
          },
        });
      }
    }

    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/creator/earnings
// @desc    Get earnings breakdown
// @access  Private
router.get('/earnings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const recentEarnings = await Revenue.find({ creator: req.user._id })
      .sort('-createdAt')
      .limit(50)
      .populate('post', 'title');

    res.json({
      success: true,
      data: {
        totalEarnings: user.totalEarnings,
        pendingPayout: user.pendingPayout,
        shortsEarnings: user.shortsEarnings,
        recentEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
