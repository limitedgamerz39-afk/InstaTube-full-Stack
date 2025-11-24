import { logError } from '../utils/logger.js';

// ✅ Custom error class for application-specific errors
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.isAppError = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// ✅ Error handler for development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// ✅ Error handler for production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error
    logError('PROGRAMMING_ERROR', {
      message: err.message,
      stack: err.stack
    });
    
    // Send generic message
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// ✅ Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log all errors
  logError('GLOBAL_ERROR', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?._id
  });
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // In production, we want to avoid leaking sensitive information
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific errors
    if (err.name === 'CastError') error = handleCastError(error);
    if (err.code === 11000) error = handleDuplicateFields(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};

// ✅ Handle MongoDB CastError (invalid ID)
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// ✅ Handle MongoDB duplicate field error
const handleDuplicateFields = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// ✅ Handle MongoDB validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// ✅ Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

// ✅ Handle rate limiting errors
export const handleRateLimitError = (err, req, res, next) => {
  if (err.statusCode === 429) {
    logError('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      url: req.originalUrl,
      userId: req.user?._id
    });
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }
  next(err);
};

// ✅ 404 handler
export const notFound = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  logError('ROUTE_NOT_FOUND', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  });
  
  next(new AppError(message, 404));
};

// ✅ Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  handleRateLimitError
};