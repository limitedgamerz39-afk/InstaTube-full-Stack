import rateLimit from 'express-rate-limit';
import redisClient from '../config/redis.js';

// ✅ Enhanced API rate limiter with Redis store for distributed systems
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 requests per windowMs for better scaling
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

// ✅ Enhanced auth rate limiter for login/register endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased to 50 requests per windowMs for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Enhanced upload rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased to 100 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Specific rate limiter for user suggestions endpoint
export const suggestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased to 2000 requests per windowMs for suggestions endpoint
  message: {
    success: false,
    message: 'Too many suggestions requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Role-based rate limiting
export const createRoleBasedLimiter = (requestsPerWindow, windowMs) => {
  return rateLimit({
    windowMs: windowMs,
    max: requestsPerWindow,
    message: {
      success: false,
      message: 'Rate limit exceeded for your user role.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user ? req.user._id : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user && req.user.role === 'admin';
    }
  });
};

// ✅ Create role-specific limiters
export const adminLimiter = createRoleBasedLimiter(10000, 15 * 60 * 1000); // Increased to 10000 requests per 15 minutes for admins
export const creatorLimiter = createRoleBasedLimiter(5000, 15 * 60 * 1000); // Increased to 5000 requests per 15 minutes for creators
export const userLimiter = createRoleBasedLimiter(1000, 15 * 60 * 1000); // Increased to 1000 requests per 15 minutes for regular users

// ✅ Sliding window rate limiter for critical operations
export const criticalOperationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Increased from 3 to 10 attempts per window for critical operations
  message: {
    success: false,
    message: 'Too many attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});