import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username fullName avatar')
      .populate('following', 'username fullName avatar')
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 } },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    user.fullName = req.body.fullName || user.fullName;
    user.username = req.body.username || user.username;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.gender = req.body.gender || user.gender;

    // Handle avatar upload
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      const file = req.files.avatar[0];
      console.log('📤 Uploading avatar to Cloudinary...');
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.mimetype);
      const result = await uploadToCloudinary(file.buffer, 'instatube/avatars');
      console.log('✅ Avatar upload successful:', result.secure_url);
      user.avatar = result.secure_url;
    }

    // Handle cover image upload
    if (req.files && req.files.cover && req.files.cover[0]) {
      const file = req.files.cover[0];
      console.log('📤 Uploading cover image to Cloudinary...');
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.mimetype);
      const result = await uploadToCloudinary(file.buffer, 'instatube/covers');
      console.log('✅ Cover upload successful:', result.secure_url);
      user.coverImage = result.secure_url;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== req.params.id
      );
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );

      await currentUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        isFollowing: false,
      });
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);

      await currentUser.save();
      await userToFollow.save();

      // Create notification
      const notification = await Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you`,
      });

      // Emit socket event (handled in socket.js)
      const io = req.app.get('io');
      io.to(userToFollow._id.toString()).emit('notification', notification);

      res.status(200).json({
        success: true,
        message: 'User followed successfully',
        isFollowing: true,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Public
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username fullName avatar bio followers following')
      .limit(20);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user suggestions (users not followed)
// @route   GET /api/users/suggestions
// @access  Private
export const getUserSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const suggestions = await User.find({
      _id: { $nin: [...currentUser.following, currentUser._id] },
    })
      .select('username fullName avatar bio followers')
      .limit(5);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Request role upgrade to creator
// @route   POST /api/users/role/request
// @access  Private
export const requestRoleUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'creator' || user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'You already have creator/admin privileges' });
    }

    user.roleUpgradeRequested = true;
    user.roleUpgradeReason = (req.body?.reason || '').slice(0, 200);
    await user.save();

    res.status(200).json({ success: true, message: 'Role upgrade requested. Admin will review soon.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
