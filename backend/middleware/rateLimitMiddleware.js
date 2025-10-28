// Simple in-memory rate limiter
// For production, use Redis-based rate limiting (e.g., express-rate-limit with Redis)

const rateLimitStore = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 3600000); // Run every hour

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 */
export const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const identifier = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    
    if (!rateLimitStore.has(identifier)) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }
    
    const userData = rateLimitStore.get(identifier);
    
    // Reset if window has passed
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
      return next();
    }
    
    // Check if limit exceeded
    if (userData.count >= maxRequests) {
      const retryAfter = Math.ceil((userData.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter,
      });
    }
    
    userData.count++;
    next();
  };
};

// Common rate limiters
export const authLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const apiLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
export const uploadLimiter = createRateLimiter(10, 60 * 60 * 1000); // 10 uploads per hour
