import User from '../models/User.js';
import Revenue from '../models/Revenue.js';
import Post from '../models/Post.js';
import LiveStream from '../models/LiveStream.js';

// @desc    Get detailed monetization analytics
// @route   GET /api/monetization/analytics
// @access  Private (Creator)
export const getMonetizationAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isMonetizationEnabled || !user.monetizationApproved) {
      return res.status(403).json({
        success: false,
        message: 'Monetization not enabled for this account',
      });
    }

    // Get revenue by source
    const revenueBySource = await Revenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        },
      },
    ]);

    // Get monthly earnings trend
    const monthlyEarnings = await Revenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month'
          },
          total: { $sum: '$amount' },
          adRevenue: {
            $sum: {
              $cond: [{ $eq: ['$source', 'ad_revenue'] }, '$amount', 0]
            }
          },
          superChat: {
            $sum: {
              $cond: [{ $eq: ['$source', 'super_chat'] }, '$amount', 0]
            }
          },
          shortsFund: {
            $sum: {
              $cond: [{ $eq: ['$source', 'shorts_fund'] }, '$amount', 0]
            }
          }
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top earning posts
    const topEarningPosts = await Revenue.aggregate([
      { $match: { creator: req.user._id, post: { $exists: true } } },
      {
        $group: {
          _id: '$post',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'post'
        }
      },
      { $unwind: '$post' },
      {
        $project: {
          _id: '$post._id',
          title: '$post.title',
          total: 1,
          count: 1,
          mediaUrl: '$post.mediaUrl',
          views: '$post.views'
        }
      }
    ]);

    // Get top earning live streams
    const topEarningStreams = await Revenue.aggregate([
      { $match: { creator: req.user._id, liveStream: { $exists: true } } },
      {
        $group: {
          _id: '$liveStream',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'livestreams',
          localField: '_id',
          foreignField: '_id',
          as: 'stream'
        }
      },
      { $unwind: '$stream' },
      {
        $project: {
          _id: '$stream._id',
          title: '$stream.title',
          total: 1,
          count: 1,
          viewerCount: '$stream.viewerCount'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalEarnings: user.totalEarnings,
          pendingPayout: user.pendingPayout,
          subscribers: user.subscribersCount,
          totalWatchTime: user.totalWatchTime,
          subscriber: user.subscriber.length,
        },
        revenueBySource,
        monthlyEarnings,
        topEarningPosts,
        topEarningStreams
      },
    });
  } catch (error) {
    console.error('❌ Get monetization analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payout history
// @route   GET /api/monetization/payouts
// @access  Private (Creator)
export const getPayoutHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isMonetizationEnabled || !user.monetizationApproved) {
      return res.status(403).json({
        success: false,
        message: 'Monetization not enabled for this account',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const payouts = await Revenue.find({ 
      creator: req.user._id, 
      isPaid: true 
    })
    .sort('-paidAt')
    .skip(skip)
    .limit(limit);

    const total = await Revenue.countDocuments({ 
      creator: req.user._id, 
      isPaid: true 
    });

    res.status(200).json({
      success: true,
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get payout history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request payout
// @route   POST /api/monetization/payout-request
// @access  Private (Creator)
export const requestPayout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isMonetizationEnabled || !user.monetizationApproved) {
      return res.status(403).json({
        success: false,
        message: 'Monetization not enabled for this account',
      });
    }

    const { amount, paymentMethod } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount',
      });
    }

    if (amount > user.pendingPayout) {
      return res.status(400).json({
        success: false,
        message: 'Requested amount exceeds available balance',
      });
    }

    // For demo purposes, we'll process the payout immediately
    user.pendingPayout -= amount;
    user.totalEarnings -= amount; // This is just for demo - in real app, you'd track this differently
    await user.save();

    // Create payout record
    const payout = await Revenue.create({
      creator: req.user._id,
      source: 'payout',
      amount: -amount, // Negative amount to indicate payout
      description: `Payout request processed via ${paymentMethod}`,
      isPaid: true,
      paidAt: new Date(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    res.status(200).json({
      success: true,
      message: 'Payout request processed successfully',
      data: payout
    });
  } catch (error) {
    console.error('❌ Request payout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monetization settings
// @route   GET /api/monetization/settings
// @access  Private (Creator)
export const getMonetizationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isMonetizationEnabled || !user.monetizationApproved) {
      return res.status(403).json({
        success: false,
        message: 'Monetization not enabled for this account',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isMonetizationEnabled: user.isMonetizationEnabled,
        monetizationApproved: user.monetizationApproved,
        adPreferences: user.adPreferences || {
          allowMidRollAds: true,
          allowPreRollAds: true,
          allowPostRollAds: true,
          allowOverlayAds: true,
          adFrequency: 'normal' // low, normal, high
        },
        revenueSharing: user.revenueSharing || {
          platformCut: 45, // Percentage
          creatorShare: 55 // Percentage
        }
      }
    });
  } catch (error) {
    console.error('❌ Get monetization settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update monetization settings
// @route   PUT /api/monetization/settings
// @access  Private (Creator)
export const updateMonetizationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isMonetizationEnabled || !user.monetizationApproved) {
      return res.status(403).json({
        success: false,
        message: 'Monetization not enabled for this account',
      });
    }

    const { adPreferences, revenueSharing } = req.body;

    if (adPreferences) {
      user.adPreferences = {
        ...user.adPreferences,
        ...adPreferences
      };
    }

    if (revenueSharing) {
      user.revenueSharing = {
        ...user.revenueSharing,
        ...revenueSharing
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Monetization settings updated successfully',
      data: {
        adPreferences: user.adPreferences,
        revenueSharing: user.revenueSharing
      }
    });
  } catch (error) {
    console.error('❌ Update monetization settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};