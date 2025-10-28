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

// ✅ Validate environment variables
const criticalEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingCritical = [];
criticalEnvVars.forEach((varName) => {
  if (!process.env[varName]) missingCritical.push(varName);
});

if (missingCritical.length > 0) {
  console.error(`❌ Missing CRITICAL env variables: ${missingCritical.join(', ')}`);
  process.exit(1);
}

// ✅ Connect to DB
connectDB();

// ✅ Initialize Express
const app = express();
const server = createServer(app);

// ✅ Security & Logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ✅ Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CORS for Netlify & localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman or mobile
      if (
        allowedOrigins.includes(origin) ||
        /\.netlify\.app$/.test(origin) || // Allow any Netlify frontend
        /\.vercel\.app$/.test(origin)   // Optional: allow Vercel frontend
      ) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ Handle preflight requests
app.options('*', cors());

// ✅ Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io);

// ✅ Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 InstaTube API running!',
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

// ✅ Error handling
app.use(notFound);
app.use(errorHandler);

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')} + *.netlify.app`);
  console.log(`📡 Socket.io initialized`);
});
