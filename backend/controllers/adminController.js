import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Story from '../models/Story.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';
import Group from '../models/Group.js';
import CommunityPost from '../models/CommunityPost.js';
import Product from '../models/Product.js';
import Subscription from '../models/Subscription.js';
import Revenue from '../models/Revenue.js';
import Report from '../models/Report.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalMessages,
      totalStories,
      totalComments,
      totalGroups,
      totalCommunityPosts,
      totalProducts,
      totalSubscriptions,
      totalRevenue,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newPostsToday,
      newPostsThisWeek,
      newPostsThisMonth,
      bannedUsers,
      verifiedUsers,
      premiumUsers,
      creatorUsers,
      businessUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      Story.countDocuments(),
      Comment.countDocuments(),
      Group.countDocuments(),
      CommunityPost.countDocuments(),
      Product.countDocuments(),
      Subscription.countDocuments(),
      Revenue.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: oneDayAgo } }),
      User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      Post.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Post.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Post.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ role: 'creator' }),
      User.countDocuments({ role: 'business' }),
    ]);

    // Get revenue data for the last 7 days
    const revenueData = await Revenue.find({
      createdAt: { $gte: oneWeekAgo }
    }).select('amount createdAt');

    // Calculate daily revenue
    const dailyRevenue = {};
    revenueData.forEach(item => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += item.amount;
    });

    // Get top users by post count
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$posts' }
        }
      },
      {
        $match: {
          postCount: { $gt: 0 }
        }
      },
      {
        $sort: {
          postCount: -1
        }
      },
      {
        $limit: 5
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          avatar: 1,
          postCount: 1
        }
      }
    ]);

    // Get top posts by likes
    const topPosts = await Post.find()
      .populate('author', 'username fullName avatar')
      .sort({ likes: -1 })
      .limit(5)
      .select('caption likes author createdAt');

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalUsers,
          totalPosts,
          totalMessages,
          totalStories,
          totalComments,
          totalGroups,
          totalCommunityPosts,
          totalProducts,
          totalSubscriptions,
          totalRevenue,
        },
        growth: {
          activeUsers,
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
          newPostsToday,
          newPostsThisWeek,
          newPostsThisMonth,
        },
        userStats: {
          bannedUsers,
          verifiedUsers,
          premiumUsers,
          creatorUsers,
          businessUsers,
        },
        analytics: {
          dailyRevenue,
          topUsers,
          topPosts,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const isBanned = req.query.isBanned;
    const isVerified = req.query.isVerified;
    const isPremium = req.query.isPremium;

    // Build filter object
    let filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isBanned !== undefined) {
      filter.isBanned = isBanned === 'true';
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    if (isPremium !== undefined) {
      filter.isPremium = isPremium === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('posts')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all posts with pagination and filters
// @route   GET /api/admin/posts
// @access  Private/Admin
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    let filter = {};
    if (search) {
      filter.caption = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .populate('author', 'username fullName avatar')
      .populate('likes', 'username avatar')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete all user's posts
    await Post.deleteMany({ author: user._id });

    // Delete all user's comments
    await Comment.deleteMany({ author: user._id });

    // Delete all user's messages
    await Message.deleteMany({
      $or: [{ sender: user._id }, { receiver: user._id }],
    });

    // Delete all user's stories
    await Story.deleteMany({ author: user._id });

    // Delete all user's notifications
    await Notification.deleteMany({
      $or: [{ recipient: user._id }, { sender: user._id }],
    });

    // Remove user from groups
    await Group.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    // Remove user from communities
    await Community.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/admin/posts/:postId
// @access  Private/Admin
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Delete all comments for this post
    await Comment.deleteMany({ post: post._id });

    // Remove post from user's posts array
    await User.findByIdAndUpdate(post.author, {
      $pull: { posts: post._id },
    });

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:userId/ban
// @access  Private/Admin
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBanned = !user.isBanned;
    user.bannedAt = user.isBanned ? new Date() : null;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify/Unverify user
// @route   PUT /api/admin/users/:userId/verify
// @access  Private/Admin
export const toggleVerifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isVerified = !user.isVerified;
    user.verifiedAt = user.isVerified ? new Date() : null;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isVerified ? 'User verified successfully' : 'User unverified',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private/Admin
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'creator', 'business', 'admin'];
    
    // Validate role
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: user, creator, business, admin',
      });
    }
    
    // Prevent removing admin role from self
    if (req.user._id.toString() === req.params.userId && req.user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin role from yourself',
      });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Store previous role for logging
    const previousRole = user.role;
    
    // Update user role
    user.role = role;
    
    // Save the user to trigger the pre-save middleware that handles role-specific features
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User role changed from ${previousRole} to ${role}`,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          isMonetizationEnabled: user.isMonetizationEnabled,
          monetizationApproved: user.monetizationApproved,
          creatorFeatures: user.creatorFeatures,
          userFeatures: user.userFeatures,
          isBusinessProfileActive: user.isBusinessProfileActive,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reported content
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type || '';
    const status = req.query.status || '';
    const search = req.query.search || '';

    // Build filter object
    let filter = {};
    
    if (type) {
      filter.reportedType = type;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      // Search in reporter username or reason
      filter.$or = [
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const reports = await Report.find(filter)
      .populate('reporter', 'username fullName avatar')
      .populate('resolvedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        reports,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Resolve a report
// @route   PUT /api/admin/reports/:reportId/resolve
// @access  Private/Admin
export const resolveReport = async (req, res) => {
  try {
    const { notes, actionTaken } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = 'resolved';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    if (notes) report.notes = notes;
    if (actionTaken) report.actionTaken = actionTaken;

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Dismiss a report
// @route   PUT /api/admin/reports/:reportId/dismiss
// @access  Private/Admin
export const dismissReport = async (req, res) => {
  try {
    const { notes } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = 'dismissed';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    if (notes) report.notes = notes;

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report dismissed successfully',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get report details
// @route   GET /api/admin/reports/:reportId
// @access  Private/Admin
export const getReportDetails = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('reporter', 'username fullName avatar email')
      .populate('resolvedBy', 'username fullName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Populate reported content based on type
    let reportedContent = null;
    switch (report.reportedType) {
      case 'post':
        reportedContent = await Post.findById(report.reportedId)
          .populate('author', 'username fullName avatar');
        break;
      case 'comment':
        reportedContent = await Comment.findById(report.reportedId)
          .populate('author', 'username fullName avatar')
          .populate('post', 'caption');
        break;
      case 'user':
        reportedContent = await User.findById(report.reportedId)
          .select('username fullName avatar email isBanned role');
        break;
      case 'story':
        reportedContent = await Story.findById(report.reportedId)
          .populate('author', 'username fullName avatar');
        break;
      case 'message':
        reportedContent = await Message.findById(report.reportedId)
          .populate('sender', 'username fullName avatar');
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        report,
        reportedContent,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search users/posts
// @route   GET /api/admin/search
// @access  Private/Admin
export const adminSearch = async (req, res) => {
  try {
    const { query, type } = req.query;

    let results = [];

    if (type === 'users' || !type) {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      }).limit(20);
      results = [...results, ...users];
    }

    if (type === 'posts' || !type) {
      const posts = await Post.find({
        caption: { $regex: query, $options: 'i' },
      })
        .populate('author', 'username avatar')
        .limit(20);
      results = [...results, ...posts];
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get role upgrade requests
// @route   GET /api/admin/role-requests
// @access  Private/Admin
export const getRoleRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ roleUpgradeRequested: true })
      .select('username fullName avatar email role roleUpgradeReason createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ roleUpgradeRequested: true });

    res.status(200).json({
      success: true,
      data: {
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve role upgrade request (set role to creator)
// @route   POST /api/admin/role-requests/:userId/approve
// @access  Private/Admin
export const approveRoleRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = 'creator';
    user.roleUpgradeRequested = false;
    user.roleUpgradeReason = '';
    await user.save();

    res.status(200).json({ success: true, message: 'User upgraded to creator', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Decline role upgrade request
// @route   POST /api/admin/role-requests/:userId/decline
// @access  Private/Admin
export const declineRoleRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.roleUpgradeRequested = false;
    // Optionally store decline reason
    user.roleUpgradeReason = '';
    await user.save();

    res.status(200).json({ success: true, message: 'Role upgrade request declined', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed user information
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('posts', 'caption createdAt likes comments')
      .populate('subscriber', 'username fullName avatar')
      .populate('subscribed', 'username fullName avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's recent activity
    const recentPosts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentComments = await Comment.find({ author: user._id })
      .populate('post', 'caption')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        user,
        recentActivity: {
          posts: recentPosts,
          comments: recentComments,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get detailed post information
// @route   GET /api/admin/posts/:postId
// @access  Private/Admin
export const getPostDetails = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username fullName avatar')
      .populate('likes', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar',
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        post,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get system health information
// @route   GET /api/admin/system/health
// @access  Private/Admin
export const getSystemHealth = async (req, res) => {
  try {
    // Get basic system info
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Get user count
    const userCount = await User.countDocuments();
    
    // Get post count
    const postCount = await Post.countDocuments();
    
    // Get recent error count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Note: We don't have an error log collection, so we'll return 0 for now
    const errorCount = 0;
    
    res.status(200).json({
      success: true,
      data: {
        system: {
          uptime: Math.floor(uptime),
          memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
          },
          cpu: cpuUsage,
        },
        database: {
          status: dbStatus,
        },
        application: {
          users: userCount,
          posts: postCount,
          recentErrors: errorCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getSystemLogs = async (req, res) => {
  try {
    // Since we don't have a dedicated logs collection, we'll return a placeholder
    res.status(200).json({
      success: true,
      data: {
        logs: [],
        message: 'Log functionality not yet implemented',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
export const getUserAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily user signups
    const userSignups = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        userSignups,
        roleDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get content analytics
// @route   GET /api/admin/analytics/content
// @access  Private/Admin
export const getContentAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily post creation
    const postCreation = await Post.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Get content category distribution
    const categoryDistribution = await Post.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        postCreation,
        categoryDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get advanced user analytics
// @route   GET /api/admin/analytics/users/advanced
// @access  Private/Admin
export const getAdvancedUserAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get user registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Get user activity trends (based on updated posts)
    const activityTrends = await User.aggregate([
      {
        $match: {
          updatedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$updatedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // Get user engagement by role
    const roleEngagement = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts',
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'author',
          as: 'comments',
        },
      },
      {
        $addFields: {
          postCount: { $size: '$posts' },
          commentCount: { $size: '$comments' },
        },
      },
      {
        $group: {
          _id: '$role',
          userCount: { $sum: 1 },
          totalPosts: { $sum: '$postCount' },
          totalComments: { $sum: '$commentCount' },
        },
      },
    ]);

    // Get top creators by subscriber count
    const topCreators = await User.find({ role: 'creator' })
      .sort({ subscribersCount: -1 })
      .limit(10)
      .select('username fullName avatar subscribersCount');

    res.status(200).json({
      success: true,
      data: {
        registrationTrends,
        activityTrends,
        roleEngagement,
        topCreators,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get monetization analytics
// @route   GET /api/admin/analytics/monetization
// @access  Private/Admin
export const getMonetizationAnalytics = async (req, res) => {
  try {
    // Get premium user stats
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const premiumUsersByPlan = await User.aggregate([
      {
        $match: { isPremium: true },
      },
      {
        $group: {
          _id: '$premiumPlan',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get creator monetization stats
    const monetizedCreators = await User.countDocuments({ 
      isMonetizationEnabled: true, 
      monetizationApproved: true 
    });

    // Get revenue stats
    const totalRevenue = await Revenue.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get subscription stats
    const subscriptionStats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        premiumUsers,
        premiumUsersByPlan,
        monetizedCreators,
        totalRevenue: totalRevenue[0] || { totalAmount: 0, count: 0 },
        subscriptionStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
