import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import redisClient from '../config/redis.js';

// @desc    Get user achievements
// @route   GET /api/achievements/user/:userId
// @access  Public
export const getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Try to get cached data
    try {
      const cachedAchievements = await redisClient.get(`achievements:user:${userId}`);
      if (cachedAchievements) {
        console.log(`✅ Cache hit for user achievements: ${userId}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedAchievements),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
    
    const achievements = await Achievement.find({ userId })
      .sort({ earnedAt: -1 });
    
    // Cache the achievements data for 5 minutes
    try {
      await redisClient.setEx(`achievements:user:${userId}`, 300, JSON.stringify(achievements));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      data: achievements,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user achievement stats
// @route   GET /api/achievements/user/:userId/stats
// @access  Public
export const getUserAchievementStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Try to get cached data
    try {
      const cachedStats = await redisClient.get(`achievements:stats:${userId}`);
      if (cachedStats) {
        console.log(`✅ Cache hit for user achievement stats: ${userId}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedStats),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
    
    const achievements = await Achievement.find({ userId });
    
    // Calculate stats
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const rarityCounts = {
      common: achievements.filter(a => a.rarity === 'common').length,
      uncommon: achievements.filter(a => a.rarity === 'uncommon').length,
      rare: achievements.filter(a => a.rarity === 'rare').length,
      epic: achievements.filter(a => a.rarity === 'epic').length,
      legendary: achievements.filter(a => a.rarity === 'legendary').length,
    };
    
    const stats = {
      totalAchievements: achievements.length,
      totalPoints,
      rarityCounts,
      lastEarned: achievements.length > 0 ? achievements[0].earnedAt : null
    };
    
    // Cache the stats data for 5 minutes
    try {
      await redisClient.setEx(`achievements:stats:${userId}`, 300, JSON.stringify(stats));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      data: stats,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Award achievement to user
// @route   POST /api/achievements/award
// @access  Private/Admin
export const awardAchievement = async (req, res) => {
  try {
    const { userId, achievementId, name, description, icon, rarity, points, metadata } = req.body;
    
    // Validate required fields
    if (!userId || !achievementId || !name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Validate ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if achievement already exists for this user
    const existingAchievement = await Achievement.findOne({ userId, achievementId });
    if (existingAchievement) {
      return res.status(400).json({
        success: false,
        message: 'User already has this achievement',
      });
    }
    
    // Create achievement
    const achievement = new Achievement({
      userId,
      achievementId,
      name,
      description,
      icon: icon || 'achievement',
      rarity: rarity || 'common',
      points: points || 0,
      metadata: metadata || {}
    });
    
    const savedAchievement = await achievement.save();
    
    // Clear cache for this user
    try {
      await redisClient.del(`achievements:user:${userId}`);
      await redisClient.del(`achievements:stats:${userId}`);
      console.log(`🧹 Cache cleared for user achievements: ${userId}`);
    } catch (cacheError) {
      console.error('Cache clear error:', cacheError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Achievement awarded successfully',
      data: savedAchievement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all achievements for admin
// @route   GET /api/achievements/admin/all
// @access  Private/Admin
export const getAllAchievements = async (req, res) => {
  try {
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    const { page = 1, limit = 20, userId } = req.query;
    
    // Build query
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    
    // Get achievements with pagination
    const achievements = await Achievement.find(query)
      .populate('userId', 'username fullName')
      .sort({ earnedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count
    const total = await Achievement.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: achievements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Revoke achievement from user
// @route   DELETE /api/achievements/:id
// @access  Private/Admin
export const revokeAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement ID format',
      });
    }
    
    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }
    
    const userId = achievement.userId;
    
    // Delete achievement
    await Achievement.findByIdAndDelete(id);
    
    // Clear cache for this user
    try {
      await redisClient.del(`achievements:user:${userId}`);
      await redisClient.del(`achievements:stats:${userId}`);
      console.log(`🧹 Cache cleared for user achievements: ${userId}`);
    } catch (cacheError) {
      console.error('Cache clear error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Achievement revoked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};