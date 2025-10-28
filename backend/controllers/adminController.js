import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Story from '../models/Story.js';
import Notification from '../models/Notification.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalMessages,
      totalStories,
      activeUsers,
      newUsersToday,
      newPostsToday,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      Story.countDocuments(),
      User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Post.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalMessages,
        totalStories,
        activeUsers,
        newUsersToday,
        newPostsToday,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .populate('posts')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

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

// @desc    Get all posts with pagination
// @route   GET /api/admin/posts
// @access  Private/Admin
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username fullName avatar')
      .populate('likes', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

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

    // Delete all user's messages
    await Message.deleteMany({
      $or: [{ sender: user._id }, { receiver: user._id }],
    });

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
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    // Clear upgrade request flags on role change
    user.roleUpgradeRequested = false;
    user.roleUpgradeReason = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
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
    // This will be implemented when report model is created
    res.status(200).json({
      success: true,
      data: [],
      message: 'Reports feature coming soon',
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
