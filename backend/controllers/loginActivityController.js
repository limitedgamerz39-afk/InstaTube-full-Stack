import LoginActivity from '../models/LoginActivity.js';
import User from '../models/User.js';

// @desc    Get login activities for a user
// @route   GET /api/auth/login-activities
// @access  Private
export const getUserLoginActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const activities = await LoginActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await LoginActivity.countDocuments({ user: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get login activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching login activities',
    });
  }
};

// @desc    Get recent login activities for security review
// @route   GET /api/auth/login-activities/recent
// @access  Private
export const getRecentLoginActivities = async (req, res) => {
  try {
    // Get last 10 login activities
    const activities = await LoginActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);
      
    res.status(200).json({
      success: true,
      data: {
        activities,
      },
    });
  } catch (error) {
    console.error('Get recent login activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent login activities',
    });
  }
};

// @desc    Detect suspicious login activities
// @route   GET /api/auth/login-activities/suspicious
// @access  Private
export const getSuspiciousLoginActivities = async (req, res) => {
  try {
    // Get user's recent login activities
    const recentActivities = await LoginActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50);
      
    // Detect suspicious patterns
    const suspiciousActivities = [];
    const ipAddresses = new Map();
    const devices = new Map();
    
    // Count occurrences by IP and device
    recentActivities.forEach(activity => {
      if (activity.success) {
        // Count IP addresses
        const ipCount = ipAddresses.get(activity.ipAddress) || 0;
        ipAddresses.set(activity.ipAddress, ipCount + 1);
        
        // Count device types
        const deviceCount = devices.get(activity.deviceType) || 0;
        devices.set(activity.deviceType, deviceCount + 1);
      }
    });
    
    // Flag suspicious activities (unusual IP or device)
    recentActivities.forEach(activity => {
      if (activity.success) {
        // If this IP address is rarely used by the user
        const ipCount = ipAddresses.get(activity.ipAddress);
        if (ipCount <= 1) {
          suspiciousActivities.push({
            ...activity.toObject(),
            reason: 'Unusual IP address',
            risk: 'medium'
          });
        }
        
        // If this device type is rarely used by the user
        const deviceCount = devices.get(activity.deviceType);
        if (deviceCount <= 1) {
          suspiciousActivities.push({
            ...activity.toObject(),
            reason: 'Unusual device type',
            risk: 'low'
          });
        }
      } else {
        // Failed login attempts
        suspiciousActivities.push({
          ...activity.toObject(),
          reason: 'Failed login attempt',
          risk: 'high'
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        suspiciousActivities: suspiciousActivities.slice(0, 10), // Limit to 10
        totalSuspicious: suspiciousActivities.length,
      },
    });
  } catch (error) {
    console.error('Get suspicious login activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while analyzing login activities',
    });
  }
};

export default {
  getUserLoginActivities,
  getRecentLoginActivities,
  getSuspiciousLoginActivities,
};