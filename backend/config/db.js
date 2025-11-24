import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ✅ MongoDB connection options with optimized pooling
const connectionOptions = {
  // Connection pool settings
  maxPoolSize: 20, // Maximum number of connections in the pool
  minPoolSize: 5,  // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
  retryWrites: true,
  retryReads: true,
  // Compression
  compressors: ['snappy', 'zlib'], // Enable compression
};

// ✅ Connection state tracking
let connectionState = {
  isConnected: false,
  isConnecting: false,
  lastConnectionAttempt: null,
  connectionAttempts: 0,
  maxRetries: 5,
  retryDelay: 1000 // 1 second
};

// ✅ Enhanced connection function with retry logic
const connectDB = async () => {
  // Prevent multiple simultaneous connection attempts
  if (connectionState.isConnecting) {
    console.log('⏳ Already connecting to database...');
    return;
  }

  // If already connected, return
  if (connectionState.isConnected) {
    console.log('✅ Already connected to database');
    return;
  }

  connectionState.isConnecting = true;
  connectionState.lastConnectionAttempt = Date.now();
  connectionState.connectionAttempts++;

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.connectionAttempts = 0;
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // ✅ Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      connectionState.isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected');
      connectionState.isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected');
      connectionState.isConnected = true;
    });
    
    mongoose.connection.on('disconnecting', () => {
      console.log('🔄 Mongoose disconnecting');
    });
    
    // ✅ Handle process termination
    process.on('SIGINT', async () => {
      console.log('🛑 Shutting down MongoDB connection...');
      await mongoose.connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    connectionState.isConnecting = false;
    
    // ✅ Retry logic with exponential backoff
    if (connectionState.connectionAttempts < connectionState.maxRetries) {
      const delay = connectionState.retryDelay * Math.pow(2, connectionState.connectionAttempts - 1);
      console.log(`⏳ Retrying connection in ${delay}ms... (Attempt ${connectionState.connectionAttempts}/${connectionState.maxRetries})`);
      
      setTimeout(() => {
        connectDB();
      }, delay);
    } else {
      console.error('💥 Max connection attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

// ✅ Export connection state for monitoring
export const getConnectionState = () => ({ ...connectionState });

// ✅ Health check function
export const checkDBHealth = async () => {
  try {
    if (!connectionState.isConnected) {
      return { status: 'disconnected', message: 'Not connected to database' };
    }
    
    // Test connection with a simple query
    await mongoose.connection.db.admin().ping();
    return { status: 'connected', message: 'Database is healthy' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};

export default connectDB;