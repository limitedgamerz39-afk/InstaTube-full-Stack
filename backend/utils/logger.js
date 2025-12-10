import winston from 'winston';
import path from 'path';

// ✅ Create a logger instance with multiple transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'd4d-hub-backend' },
  transports: [
    // ✅ Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // ✅ Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// ✅ If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ✅ Create a structured logging function
export const logEvent = (level, event, data = {}) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  logger.log(level, logData);
};

// ✅ Specific logging functions for different types of events
export const logInfo = (event, data) => logEvent('info', event, data);
export const logError = (event, data) => logEvent('error', event, data);
export const logWarn = (event, data) => logEvent('warn', event, data);
export const logDebug = (event, data) => logEvent('debug', event, data);

// ✅ Specialized logging for security events
export const logSecurityEvent = (event, data) => {
  logEvent('warn', `SECURITY: ${event}`, data);
};

// ✅ Specialized logging for performance metrics
export const logPerformance = (operation, durationMs, data = {}) => {
  logEvent('info', `PERFORMANCE: ${operation}`, {
    durationMs,
    ...data
  });
};

// ✅ Specialized logging for API requests
export const logApiRequest = (req, res, durationMs) => {
  const { method, url, ip, user } = req;
  const { statusCode } = res;
  
  logEvent('info', 'API_REQUEST', {
    method,
    url,
    ip,
    userId: user?._id,
    statusCode,
    durationMs
  });
};

export default logger;