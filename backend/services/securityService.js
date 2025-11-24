import SecurityLog from '../models/SecurityLog.js';
import { getGeolocation } from '../utils/deviceDetection.js';

// Log security events
export const logSecurityEvent = async (eventType, description, severity, details = {}, req = null) => {
  try {
    const logData = {
      eventType,
      description,
      severity,
      details,
    };
    
    // Add user info if available
    if (req && req.user) {
      logData.userId = req.user._id;
    }
    
    // Add IP and user agent if available
    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress || 
                         (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : 'unknown');
      logData.userAgent = req.headers['user-agent'] || 'unknown';
      logData.location = getGeolocation(logData.ipAddress);
    } else {
      logData.ipAddress = 'unknown';
      logData.userAgent = 'unknown';
      logData.location = getGeolocation('unknown');
    }
    
    const securityLog = new SecurityLog(logData);
    await securityLog.save();
    
    // Log to console for debugging
    console.log(`[SECURITY] ${eventType}: ${description} (Severity: ${severity})`);
    
    return securityLog;
  } catch (error) {
    console.error('Error logging security event:', error);
    // Don't throw error as this shouldn't break the main flow
  }
};

// Get recent security events
export const getRecentSecurityEvents = async (limit = 50) => {
  try {
    const events = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username email');
      
    return events;
  } catch (error) {
    console.error('Error fetching security events:', error);
    throw error;
  }
};

// Get security events by user
export const getUserSecurityEvents = async (userId, limit = 20) => {
  try {
    const events = await SecurityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return events;
  } catch (error) {
    console.error('Error fetching user security events:', error);
    throw error;
  }
};

// Get security events by type
export const getSecurityEventsByType = async (eventType, limit = 50) => {
  try {
    const events = await SecurityLog.find({ eventType })
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return events;
  } catch (error) {
    console.error('Error fetching security events by type:', error);
    throw error;
  }
};

// Get security events by severity
export const getSecurityEventsBySeverity = async (severity, limit = 50) => {
  try {
    const events = await SecurityLog.find({ severity })
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return events;
  } catch (error) {
    console.error('Error fetching security events by severity:', error);
    throw error;
  }
};

export default {
  logSecurityEvent,
  getRecentSecurityEvents,
  getUserSecurityEvents,
  getSecurityEventsByType,
  getSecurityEventsBySeverity,
};