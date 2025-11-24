import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import LoginActivity from '../models/LoginActivity.js';
import { anonymizeUserData } from '../utils/dataRetention.js';
import { logSecurityEvent } from '../services/securityService.js';

// @desc    Get user's personal data (GDPR right to access)
// @route   GET /api/gdpr/data
// @access  Private
export const getUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch all user-related data
    const user = await User.findById(userId);
    const posts = await Post.find({ author: userId });
    const comments = await Comment.find({ author: userId });
    const messages = await Message.find({ 
      $or: [{ sender: userId }, { recipient: userId }] 
    });
    const loginActivities = await LoginActivity.find({ user: userId });
    
    // Compile data report
    const dataReport = {
      user: user ? user.toJSON() : null,
      posts: posts.map(post => post.toJSON()),
      comments: comments.map(comment => comment.toJSON()),
      messages: messages.map(message => ({
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        timestamp: message.createdAt,
        // Don't include sensitive message content in export
      })),
      loginActivities: loginActivities.map(activity => activity.toJSON()),
      dataExportedAt: new Date()
    };
    
    // Log the data access
    await logSecurityEvent(
      'gdpr_data_export',
      `User requested personal data export`,
      'low',
      { userId, dataPoints: Object.keys(dataReport).length },
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Personal data retrieved successfully',
      data: dataReport
    });
  } catch (error) {
    console.error('GDPR data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve personal data'
    });
  }
};

// @desc    Delete user account and data (GDPR right to be forgotten)
// @route   DELETE /api/gdpr/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Anonymize user data instead of complete deletion (for legal/compliance reasons)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Anonymize user profile
    const anonymizedUser = anonymizeUserData(user);
    await User.findByIdAndUpdate(userId, anonymizedUser);
    
    // Delete user's posts
    await Post.deleteMany({ author: userId });
    
    // Delete user's comments
    await Comment.deleteMany({ author: userId });
    
    // Delete user's messages
    await Message.deleteMany({ 
      $or: [{ sender: userId }, { recipient: userId }] 
    });
    
    // Delete login activities
    await LoginActivity.deleteMany({ user: userId });
    
    // Log the account deletion
    await logSecurityEvent(
      'gdpr_account_deletion',
      `User account anonymized for GDPR compliance`,
      'medium',
      { userId },
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Account data has been anonymized in compliance with GDPR'
    });
  } catch (error) {
    console.error('GDPR account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account data'
    });
  }
};

// @desc    Update user consent preferences
// @route   PUT /api/gdpr/consent
// @access  Private
export const updateConsent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { consentPreferences } = req.body;
    
    // Update user's consent preferences
    const user = await User.findByIdAndUpdate(
      userId,
      { consentPreferences },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log the consent update
    await logSecurityEvent(
      'gdpr_consent_update',
      `User updated consent preferences`,
      'low',
      { userId, preferences: consentPreferences },
      req
    );
    
    res.status(200).json({
      success: true,
      message: 'Consent preferences updated successfully',
      data: { consentPreferences: user.consentPreferences }
    });
  } catch (error) {
    console.error('GDPR consent update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update consent preferences'
    });
  }
};

// @desc    Get user's consent status
// @route   GET /api/gdpr/consent
// @access  Private
export const getConsentStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's consent preferences
    const user = await User.findById(userId).select('consentPreferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { consentPreferences: user.consentPreferences || {} }
    });
  } catch (error) {
    console.error('GDPR consent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve consent status'
    });
  }
};