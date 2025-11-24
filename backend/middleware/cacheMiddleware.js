import redisClient from '../config/redis.js';

// Middleware to cache data
export const cache = (key, expiration = 300) => async (req, res, next) => {
  try {
    // Check if Redis client is available and open
    if (!redisClient || (redisClient.isOpen !== undefined && !redisClient.isOpen)) {
      console.log('⚠️ Redis not available, skipping cache');
      return next();
    }
    
    // Try to get data from cache
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      console.log(`📦 Cache hit for key: ${key}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    console.log(`🔍 Cache miss for key: ${key}`);
    
    // Modify res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response data
      redisClient.setEx(key, expiration, JSON.stringify(data));
      console.log(`💾 Cached data for key: ${key} (TTL: ${expiration}s)`);
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Cache middleware error:', error);
    next();
  }
};

// Middleware to cache data with dynamic key based on request params
export const cacheWithParams = (keyGenerator, expiration = 300) => async (req, res, next) => {
  try {
    // Check if Redis client is available and open
    if (!redisClient || (redisClient.isOpen !== undefined && !redisClient.isOpen)) {
      console.log('⚠️ Redis not available, skipping cache');
      return next();
    }
    
    const key = keyGenerator(req);
    
    // Try to get data from cache
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      console.log(`📦 Cache hit for key: ${key}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    console.log(`🔍 Cache miss for key: ${key}`);
    
    // Modify res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response data
      redisClient.setEx(key, expiration, JSON.stringify(data));
      console.log(`💾 Cached data for key: ${key} (TTL: ${expiration}s)`);
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Cache middleware error:', error);
    next();
  }
};

// Middleware to clear cache for a specific key
export const clearCache = (key) => async (req, res, next) => {
  try {
    // Check if Redis client is available and open
    if (!redisClient || (redisClient.isOpen !== undefined && !redisClient.isOpen)) {
      console.log('⚠️ Redis not available, skipping cache clear');
      return next();
    }
    
    await redisClient.del(key);
    console.log(`🧹 Cache cleared for key: ${key}`);
  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
  next();
};

// Middleware to clear user cache
export const clearUserCache = async (req, res, next) => {
  try {
    // Check if Redis client is available and open
    if (!redisClient || (redisClient.isOpen !== undefined && !redisClient.isOpen)) {
      console.log('⚠️ Redis not available, skipping cache clear');
      return next();
    }
    
    const userId = req.user?._id;
    if (userId) {
      await redisClient.del(`user:${userId}`);
      console.log(`🧹 Cache cleared for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ User cache clear error:', error);
  }
  next();
};

// Middleware to clear multiple cache keys
export const clearMultipleCache = (keys) => async (req, res, next) => {
  try {
    // Check if Redis client is available and open
    if (!redisClient || (redisClient.isOpen !== undefined && !redisClient.isOpen)) {
      console.log('⚠️ Redis not available, skipping cache clear');
      return next();
    }
    
    for (const key of keys) {
      await redisClient.del(key);
      console.log(`🧹 Cache cleared for key: ${key}`);
    }
  } catch (error) {
    console.error('❌ Multiple cache clear error:', error);
  }
  next();
};