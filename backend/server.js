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

// ✅ Environment Variable Validation
const criticalEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

console.log('\n🔍 Environment Variables Check:');
const missingCritical = [];
const missingOptional = [];

criticalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`${varName}: ✅ Loaded`);
  } else {
    console.log(`${varName}: ❌ Missing (CRITICAL)`);
    missingCritical.push(varName);
  }
});

optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`${varName}: ✅ Loaded`);
  } else {
    console.log(`${varName}: ⚠️  Missing (Optional - uploads disabled)`);
    missingOptional.push(varName);
  }
});

if (missingCritical.length > 0) {
  console.error(`\n❌ Missing CRITICAL environment variables: ${missingCritical.join(', ')}`);
  console.error('Please create a .env file with all required variables.\n');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.warn(`\n⚠️  Missing optional variables: ${missingOptional.join(', ')}`);
  console.warn('Uploads may be disabled. Get free credentials at https://cloudinary.com\n');
} else {
  console.log('\n✅ All environment variables are loaded\n');
}

// ✅ Connect to Database
connectDB();

// ✅ Initialize Express App
const app = express();
const server = createServer(app);

// ✅ Security & Logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ✅ Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io); // Make io accessible in controllers

// ✅ Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Fixed CORS Configuration (supports Netlify & localhost)
const allowedOrigins = [
  'https://instatube-app.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman/mobile
      if (allowedOrigins.includes(origin) || /\.netlify\.app$/.test(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ Handle Preflight Requests Globally
app.options('*', cors());

// ✅ Routes
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
      admin: '/api/admin',
      groups: '/api/groups',
      ai: '/api/ai',
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
app.use('/api/ai', aiRoutes);

// ✅ Error Handling
app.use(notFound);
app.use(errorHandler);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')} + *.netlify.app`);
  console.log(`📡 Socket.io initialized`);
});
