import mongoose from 'mongoose';
import redisClient from './config/redis.js';

// ✅ Enhanced health check with detailed service status
export const healthCheck = async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  try {
    // ✅ Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState;
    healthStatus.services.mongodb = {
      status: mongoStatus === 1 ? 'ok' : 'error',
      message: mongoStatus === 1 ? 'Connected' : 'Disconnected'
    };

    // ✅ Check Redis connection
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        healthStatus.services.redis = {
          status: 'ok',
          message: 'Connected'
        };
      } else {
        healthStatus.services.redis = {
          status: 'error',
          message: 'Not connected'
        };
      }
    } catch (redisError) {
      healthStatus.services.redis = {
        status: 'error',
        message: redisError.message
      };
    }

    // ✅ Check system resources
    const memoryUsage = process.memoryUsage();
    healthStatus.system = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      cpu: process.cpuUsage()
    };

    // ✅ Overall status
    const hasErrors = Object.values(healthStatus.services).some(service => service.status === 'error');
    if (hasErrors) {
      healthStatus.status = 'degraded';
      return res.status(503).json(healthStatus);
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    healthStatus.status = 'error';
    healthStatus.error = error.message;
    res.status(500).json(healthStatus);
  }
};

// ✅ Simple liveness check
export const livenessCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Service is alive'
  });
};

// ✅ Readiness check
export const readinessCheck = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        message: 'Database not connected'
      });
    }

    // Check if Redis is connected (if enabled)
    if (process.env.REDIS_ENABLED === 'true') {
      if (!redisClient.isOpen) {
        return res.status(503).json({
          status: 'not ready',
          message: 'Redis not connected'
        });
      }
    }

    res.status(200).json({
      status: 'ready',
      message: 'Service is ready to accept requests'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      message: error.message
    });
  }
};

export default {
  healthCheck,
  livenessCheck,
  readinessCheck
};