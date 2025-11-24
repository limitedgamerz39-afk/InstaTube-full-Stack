import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate Access Token (short-lived)
export const generateAccessToken = (id) => {
  console.log('Generating access token for user ID:', id);
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
  console.log('Access token generated:', token ? token.substring(0, 10) + '...' : 'None');
  return token;
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (id) => {
  console.log('Generating refresh token for user ID:', id);
  const token = jwt.sign({ id }, process.env.REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 days
  });
  console.log('Refresh token generated:', token ? token.substring(0, 10) + '...' : 'None');
  return token;
};

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Bearer header:', token ? token.substring(0, 10) + '...' : 'None');
    }

    // Also check for token in cookies (fallback)
    if (!token && req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
      console.log('Token found in cookies:', token ? token.substring(0, 10) + '...' : 'None');
    }

    // Also check for token in body (fallback for some clients)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
      console.log('Token found in body:', token ? token.substring(0, 10) + '...' : 'None');
    }

    if (!token) {
      console.log('No token provided, returning 401');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // Validate token format before verification
    if (!token || typeof token !== 'string') {
      console.log('Invalid token format, returning 401');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token format',
      });
    }

    try {
      // Verify token
      console.log('Verifying token with JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Missing');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User found:', req.user ? req.user.username : 'None');

      if (!req.user) {
        console.log('User not found in database, returning 401');
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  } catch (error) {
    console.log('Server error in auth middleware:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error in auth middleware',
    });
  }
};

// Generate JWT Token (deprecated - for backward compatibility)
export const generateToken = (id) => {
  console.log('Generating token for user ID:', id);
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  console.log('Token generated:', token ? token.substring(0, 10) + '...' : 'None');
  return token;
};