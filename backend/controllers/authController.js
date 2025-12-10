import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import speakeasy from 'speakeasy';
import { logSecurityEvent, logInfo } from '../utils/logger.js';
import { userValidationRules } from '../middleware/validationMiddleware.js';

// ✅ Sign token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Default to 7 days if not set
  });
};

// ✅ Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // Default to 30 days if not set
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    data: {
      user,
    },
  });
};

// ✅ Register user
export const register = [
  ...userValidationRules.register,
  async (req, res, next) => {
    try {
      const { username, email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE', {
          email,
          username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          message: `User with this ${field} already exists`,
        });
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password,
        fullName,
      });

      logInfo('USER_REGISTERED', {
        userId: user._id,
        username: user.username,
        email: user.email,
        ip: req.ip
      });

      createSendToken(user, 201, res);
    } catch (error) {
      logSecurityEvent('REGISTRATION_ERROR', {
        error: error.message,
        email: req.body.email,
        username: req.body.username,
        ip: req.ip
      });
      
      next(error);
    }
  }
];

// ✅ Login user
export const login = [
  ...userValidationRules.login,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Check if email and password exist
      if (!email || !password) {
        logSecurityEvent('LOGIN_ATTEMPT_MISSING_CREDENTIALS', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
      }

      // Check if user exists and password is correct
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        logSecurityEvent('LOGIN_ATTEMPT_FAILED', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          message: 'Incorrect email or password',
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        logSecurityEvent('LOGIN_ATTEMPT_BANNED_USER', {
          userId: user._id,
          email: user.email,
          ip: req.ip
        });
        
        return res.status(401).json({
          success: false,
          message: 'Your account has been banned',
        });
      }

      logInfo('USER_LOGGED_IN', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });

      createSendToken(user, 200, res);
    } catch (error) {
      logSecurityEvent('LOGIN_ERROR', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });
      
      next(error);
    }
  }
];

// ✅ Logout user
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  // Only log if user is authenticated
  if (req.user) {
    logInfo('USER_LOGGED_OUT', {
      userId: req.user._id,
      ip: req.ip
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// ✅ Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    // Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email address',
      });
    }

    // Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    // Send email
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      // In a real app, you would send an actual email
      console.log('Password reset email would be sent to:', user.email);
      console.log('Reset URL:', resetURL);

      res.status(200).json({
        success: true,
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'There was an error sending the email. Try again later!',
      });
    }
  } catch (error) {
    next(error);
  }
};

// ✅ Reset password
export const resetPassword = async (req, res, next) => {
  try {
    // Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired',
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ✅ Update password
export const updatePassword = async (req, res, next) => {
  try {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // Check if posted current password is correct
    if (!(await user.comparePassword(req.body.passwordCurrent))) {
      return res.status(401).json({
        success: false,
        message: 'Your current password is wrong',
      });
    }

    // If so, update password
    user.password = req.body.password;
    await user.save();

    // Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ✅ Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token does no longer exist',
      });
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password! Please log in again',
      });
    }

    // Create new access token
    const newToken = signToken(currentUser._id);

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// ✅ Setup 2FA
export const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `InstaTube (${user.email})`,
      issuer: 'InstaTube',
    });

    // Save secret to user (temporarily)
    user.twoFactorSecret = secret.base32;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        qrCode: secret.otpauth_url,
        secret: secret.base32,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Verify 2FA
export const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = undefined; // Clear temporary secret
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Disable 2FA
export const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
};
