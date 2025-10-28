import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import connectDB from './config/db.js';
import initializeSocket from './socket/socket.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import exploreRoutes from './routes/exploreRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const criticalEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

console.log('\n🔍 Environment Variables Check:');
const missingCritical = [];
const missingOptional = [];

// Check critical vars
criticalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`${varName}: ✅ Loaded`);
  } else {
    console.log(`${varName}: ❌ Missing (CRITICAL)`);
    missingCritical.push(varName);
  }
});

// Check optional vars
optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`${varName}: ✅ Loaded`);
  } else {
    console.log(`${varName}: ⚠️  Missing (Optional - uploads disabled)`);
    missingOptional.push(varName);
  }
});

// Exit if critical vars are missing
if (missingCritical.length > 0) {
  console.error(`\n❌ Missing CRITICAL environment variables: ${missingCritical.join(', ')}`);
  console.error('Please create a .env file with all required variables.\n');
  process.exit(1);
}

// Warn about optional vars
if (missingOptional.length > 0) {
  console.warn(`\n⚠️  Missing optional variables: ${missingOptional.join(', ')}`);
  console.warn('File uploads will be disabled. Get free credentials at https://cloudinary.com\n');
} else {
  console.log('\n✅ All environment variables are loaded\n');
}

// Connect to Database
connectDB();

// Initialize Express App
const app = express();
const server = createServer(app);

// Security & Logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io); // Make io accessible in controllers

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use('/api/ai', aiRoutes);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 InstaTube API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      notifications: '/api/notifications',
      messages: '/api/messages',
      stories: '/api/stories',
      explore: '/api/explore',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📡 Socket.io initialized`);
});
