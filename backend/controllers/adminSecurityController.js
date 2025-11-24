import SecurityLog from '../models/SecurityLog.js';
import LoginActivity from '../models/LoginActivity.js';
import User from '../models/User.js';

// @desc    Get security events
// @route   GET /api/admin/security/events
// @access  Private/Admin
export const getSecurityEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const eventType = req.query.eventType || '';
    const severity = req.query.severity || '';
    const search = req.query.search || '';

    // Build filter object
    let filter = {};
    
    if (eventType) {
      filter.eventType = eventType;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (search) {
      // Search in description or user info
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'details.username': { $regex: search, $options: 'i' } },
        { 'details.email': { $regex: search, $options: 'i' } },
      ];
    }

    const events = await SecurityLog.find(filter)
      .populate('userId', 'username fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        events,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching security events',
    });
  }
};

// @desc    Get login activities
// @route   GET /api/admin/security/login-activities
// @access  Private/Admin
export const getLoginActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const success = req.query.success || '';
    const search = req.query.search || '';

    // Build filter object
    let filter = {};
    
    if (success === 'true') {
      filter.success = true;
    } else if (success === 'false') {
      filter.success = false;
    }
    
    if (search) {
      // Search in user info or IP address
      filter.$or = [
        { ipAddress: { $regex: search, $options: 'i' } },
        { 'location.country': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }

    const activities = await LoginActivity.find(filter)
      .populate('user', 'username fullName avatar email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoginActivity.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        activities,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
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

// @desc    Get suspicious activities
// @route   GET /api/admin/security/suspicious
// @access  Private/Admin
export const getSuspiciousActivities = async (req, res) => {
  try {
    // Get recent high-severity security events
    const recentHighSeverityEvents = await SecurityLog.find({ severity: { $in: ['high', 'critical'] } })
      .populate('userId', 'username fullName avatar email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent failed login attempts
    const recentFailedLogins = await LoginActivity.find({ success: false })
      .populate('user', 'username fullName avatar email')
      .sort({ timestamp: -1 })
      .limit(20);

    // Get users with multiple failed login attempts
    const usersWithFailedLogins = await LoginActivity.aggregate([
      { $match: { success: false } },
      { $group: { _id: '$user', count: { $sum: 1 }, lastAttempt: { $max: '$timestamp' } } },
      { $match: { count: { $gte: 5 } } }, // More than 5 failed attempts
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate user info for aggregated results
    const userIds = usersWithFailedLogins.map(item => item._id).filter(id => id !== null);
    const users = await User.find({ _id: { $in: userIds } }, 'username fullName avatar email');
    
    const usersWithFailedLoginsPopulated = usersWithFailedLogins.map(item => {
      const user = users.find(u => u._id.toString() === item._id?.toString());
      return {
        ...item,
        user: user || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        highSeverityEvents: recentHighSeverityEvents,
        failedLogins: recentFailedLogins,
        usersWithMultipleFailedLogins: usersWithFailedLoginsPopulated,
      },
    });
  } catch (error) {
    console.error('Get suspicious activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while analyzing suspicious activities',
    });
  }
};

// @desc    Get security statistics
// @route   GET /api/admin/security/stats
// @access  Private/Admin
export const getSecurityStats = async (req, res) => {
  try {
    // Get counts for different event types
    const eventTypeStats = await SecurityLog.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get counts for different severity levels
    const severityStats = await SecurityLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent login stats
    const totalLogins = await LoginActivity.countDocuments();
    const successfulLogins = await LoginActivity.countDocuments({ success: true });
    const failedLogins = await LoginActivity.countDocuments({ success: false });

    // Get unique users who logged in recently
    const uniqueUsers = await LoginActivity.distinct('user', { success: true });

    res.status(200).json({
      success: true,
      data: {
        eventTypeStats,
        severityStats,
        loginStats: {
          total: totalLogins,
          successful: successfulLogins,
          failed: failedLogins,
          uniqueUsers: uniqueUsers.length,
        },
      },
    });
  } catch (error) {
    console.error('Get security stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching security statistics',
    });
  }
};

export default {
  getSecurityEvents,
  getLoginActivities,
  getSuspiciousActivities,
  getSecurityStats,
};