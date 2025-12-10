import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { uploadToStorage } from '../config/minio.js';
import redisClient, { cache } from '../config/redis.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';

// @desc    Get user by ID
// @route   GET /api/users/id/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Try to get cached data using enhanced cache
    const cachedUser = await cache.get(`user:id:${id}`);
    if (cachedUser) {
      console.log(`✅ Cache hit for user ID: ${id}`);
      return res.status(200).json({
        success: true,
        data: cachedUser,
        fromCache: true
      });
    }

    const user = await User.findById(id)
      .populate('subscriber', 'username fullName avatar')
      .populate('subscribed', 'username fullName avatar')
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

    // Cache the user data for 5 minutes using enhanced cache
    await cache.set(`user:id:${id}`, user, 300);

    res.status(200).json({
      success: true,
      data: user,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Validate username
    if (!username || username === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }
    
    // Try to get cached data using enhanced cache
    const cachedUser = await cache.get(`user:${username}`);
    if (cachedUser) {
      console.log(`✅ Cache hit for user: ${username}`);
      return res.status(200).json({
        success: true,
        data: cachedUser,
        fromCache: true
      });
    }

    const user = await User.findOne({ username })
      .populate('subscriber', 'username fullName avatar')
      .populate('subscribed', 'username fullName avatar')
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

    // Cache the user data for 5 minutes using enhanced cache
    await cache.set(`user:${username}`, user, 300);

    res.status(200).json({
      success: true,
      data: user,
      fromCache: false
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
    // Debug logging to see what we're receiving
    console.log('Received profile update request:');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (req.body.fullName !== undefined) {
      console.log('Updating fullName:', req.body.fullName);
      user.fullName = req.body.fullName;
    }
    
    // Handle username change with 15-day restriction
    if (req.body.username !== undefined && req.body.username !== user.username) {
      console.log('Attempting username change from', user.username, 'to', req.body.username);
      // Check if username was changed within the last 15 days
      if (user.usernameLastChanged) {
        const daysSinceLastChange = (Date.now() - user.usernameLastChanged.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 15) {
          return res.status(400).json({
            success: false,
            message: 'You can\'t change your username before 15 days after the last change.',
          });
        }
      }
      
      // Check if username is already taken
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken. Please choose another one.',
        });
      }
      
      // Update username and record change date
      user.username = req.body.username;
      user.usernameLastChanged = Date.now();
    }
    
    if (req.body.bio !== undefined) {
      console.log('Updating bio:', req.body.bio);
      user.bio = req.body.bio;
    }
    if (req.body.gender !== undefined) {
      console.log('Updating gender:', req.body.gender);
      user.gender = req.body.gender;
    }
    if (req.body.website !== undefined) {
      console.log('Updating website:', req.body.website);
      user.website = req.body.website;
    }
    
    // Update social links if provided
    if (req.body.socialLinks !== undefined) {
      console.log('Updating socialLinks:', req.body.socialLinks);
      try {
        const socialLinks = JSON.parse(req.body.socialLinks);
        user.socialLinks = socialLinks;
      } catch (err) {
        console.log('Invalid socialLinks format');
        // Reset to empty object if parsing fails
        user.socialLinks = {};
      }
    }

    // Handle avatar upload
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      const file = req.files.avatar[0];
      console.log('📤 Uploading avatar to MinIO...');
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.mimetype);
      const result = await uploadToStorage(file.buffer, 'd4dhub/avatars', file.originalname);
      console.log('✅ Avatar upload successful:', result.secure_url);
      user.avatar = result.secure_url;
    }

    // Handle cover image upload
    if (req.files && req.files.cover && req.files.cover[0]) {
      const file = req.files.cover[0];
      console.log('📤 Uploading cover image to MinIO...');
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.mimetype);
      const result = await uploadToStorage(file.buffer, 'd4dhub/covers', file.originalname);
      console.log('✅ Cover upload successful:', result.secure_url);
      user.coverImage = result.secure_url;
    }

    console.log('Saving user with updated data:', {
      fullName: user.fullName,
      username: user.username,
      bio: user.bio,
      gender: user.gender,
      website: user.website,
      socialLinks: user.socialLinks
    });
    
    const updatedUser = await user.save();
    console.log('User saved successfully:', updatedUser._id);

    // Clear cache for this user using enhanced cache
    await cache.del(`user:${user.username}`);
    console.log(`🧹 Cache cleared for user: ${user.username}`);

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

// @desc    Subscribe/Unsubscribe user
// @route   POST /api/users/:id/subscribe
// @access  Private
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Invalid user ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Check if trying to subscribe to self
    if (id === req.user._id.toString()) {
      console.log(`User ${req.user._id} attempted to subscribe to themselves`);
      return res.status(400).json({
        success: false,
        message: 'You cannot subscribe to yourself',
      });
    }

    const userToSubscribe = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToSubscribe) {
      console.log(`User not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isSubscribed = currentUser.subscribed.includes(id);

    if (isSubscribed) {
      // Unsubscribe
      currentUser.subscribed = currentUser.subscribed.filter(
        (userId) => userId.toString() !== id
      );
      userToSubscribe.subscriber = userToSubscribe.subscriber.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );

      await currentUser.save();
      await userToSubscribe.save();
      console.log(`User ${req.user._id} unsubscribed from user ${id}`);

      res.status(200).json({
        success: true,
        message: 'User unsubscribed successfully',
        isSubscribed: false,
      });
    } else {
      // Subscribe
      currentUser.subscribed.push(id);
      userToSubscribe.subscriber.push(req.user._id);

      await currentUser.save();
      await userToSubscribe.save();
      console.log(`User ${req.user._id} subscribed to user ${id}`);

      // Create notification
      const notification = await Notification.create({
        recipient: userToSubscribe._id,
        sender: currentUser._id,
        type: 'subscribe',
        message: `${currentUser.username} subscribed to you`,
      });

      // Emit socket event (handled in socket.js)
      const io = req.app.get('io');
      io.to(userToSubscribe._id.toString()).emit('notification', notification);

      // Check and award achievements for subscription
      try {
        await checkAndAwardAchievements(currentUser._id, 'subscribed');
        await checkAndAwardAchievements(userToSubscribe._id, 'follower_gained');
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
      }

      res.status(200).json({
        success: true,
        message: 'User subscribed successfully',
        isSubscribed: true,
      });
    }

    // Clear cache for both users using enhanced cache
    await cache.del(`user:${userToSubscribe.username}`);
    await cache.del(`user:${currentUser.username}`);
    await cache.del(`suggestions:${currentUser._id}`);
    console.log(`🧹 Cache cleared for users: ${userToSubscribe.username}, ${currentUser.username}`);
  } catch (error) {
    console.error('Subscribe/Unsubscribe error:', error);
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
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Try to get cached data using enhanced cache
    const cachedResults = await cache.get(`search:${query}:page:${pageNum}:limit:${limitNum}`);
    if (cachedResults) {
      console.log(`✅ Cache hit for user search: ${query}, page: ${pageNum}`);
      return res.status(200).json({
        success: true,
        data: cachedResults,
        fromCache: true,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasMore: true // This would need to be calculated properly in a real implementation
        }
      });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username fullName avatar bio subscriber subscribed')
      .skip(skip)
      .limit(limitNum);
    
    // Cache the search results for 2 minutes using enhanced cache
    await cache.set(`search:${query}:page:${pageNum}:limit:${limitNum}`, users, 120);
    
    res.status(200).json({
      success: true,
      data: users,
      fromCache: false,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: users.length === limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user suggestions (users not subscribed to)
// @route   GET /api/users/suggestions
// @access  Private
export const getUserSuggestions = async (req, res) => {
  try {
    // Try to get cached data using enhanced cache
    const cachedSuggestions = await cache.get(`suggestions:${req.user._id}`);
    if (cachedSuggestions) {
      console.log(`✅ Cache hit for suggestions: ${req.user._id}`);
      return res.status(200).json({
        success: true,
        data: cachedSuggestions,
        fromCache: true
      });
    }

    const currentUser = await User.findById(req.user._id);

    // Increase limit for more diverse suggestions
    const suggestions = await User.find({
      _id: { $nin: [...currentUser.subscribed, currentUser._id] },
    })
      .select('username fullName avatar bio subscriber')
      .limit(10); // Increased from 5 to 10 for better UX

    // Cache the suggestions for 30 minutes (increased from 10 minutes)
    await cache.set(`suggestions:${req.user._id}`, suggestions, 1800);

    res.status(200).json({
      success: true,
      data: suggestions,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's subscribers
// @route   GET /api/users/:username/subscribers
// @access  Private
export const getUserSubscribers = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .populate('subscriber', 'username fullName avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Add subscription status for each subscriber
    const subscribersWithStatus = await Promise.all(
      user.subscriber.map(async (subscriber) => {
        const isSubscribed = user.subscribed.includes(subscriber._id);
        return {
          ...subscriber.toObject(),
          isSubscribed
        };
      })
    );
    
    res.json({
      success: true,
      data: subscribersWithStatus,
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user's subscriptions
// @route   GET /api/users/:username/subscriptions
// @access  Private
export const getUserSubscriptions = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .populate('subscribed', 'username fullName avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Add subscription status for each subscribed user
    const subscriptionsWithStatus = await Promise.all(
      user.subscribed.map(async (subscribedUser) => {
        const isSubscribed = user.subscriber.includes(subscribedUser._id);
        return {
          ...subscribedUser.toObject(),
          isSubscribed
        };
      })
    );
    
    res.json({
      success: true,
      data: subscriptionsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Request role upgrade (e.g., user to creator)
// @route   POST /api/users/role/request
// @access  Private
export const requestRoleUpgrade = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has already requested role upgrade
    if (user.roleUpgradeRequested) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested a role upgrade. Please wait for approval.',
      });
    }

    // Update user with role request
    user.roleUpgradeRequested = true;
    user.roleUpgradeReason = req.body.message || '';
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Role upgrade request submitted successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
