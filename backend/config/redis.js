import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Enhanced Redis configuration with better error handling and connection management
const redisClient = createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// ✅ Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting');
});

redisClient.on('end', () => {
  console.log('🔚 Redis client disconnected');
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Redis client...');
  await redisClient.quit();
  process.exit(0);
});

// ✅ Enhanced caching functions with TTL management
const cache = {
  // Get data from cache
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },
  
  // Set data in cache with TTL
  set: async (key, value, ttl = 300) => {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },
  
  // Delete cache entry
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },
  
  // Cache warming function for popular content
  warm: async (key, fetchFunction, ttl = 300) => {
    try {
      // Try to get from cache first
      let data = await cache.get(key);
      
      if (!data) {
        // If not in cache, fetch and store
        data = await fetchFunction();
        if (data) {
          await cache.set(key, data, ttl);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Cache warm error for key ${key}:`, error);
      return null;
    }
  }
};

// ✅ Connect to Redis if enabled
if (process.env.REDIS_ENABLED === 'true') {
  redisClient.connect().catch(console.error);
} else {
  console.log('⚠️ Redis is disabled');
}

export { cache };
export default redisClient;