import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import initializeSocket from './socket/socket.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { apiLimiter, authLimiter, uploadLimiter, adminLimiter, creatorLimiter, userLimiter } from './middleware/rateLimitMiddleware.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import path from 'path';
import { setCdnHeaders } from './utils/cdnHelper.js';
import { logApiRequest } from './utils/logger.js';
import { healthCheck, livenessCheck, readinessCheck } from './healthcheck.js';

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
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import superChatRoutes from './routes/superChatRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import watchLaterRoutes from './routes/watchLaterRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import trendingRoutes from './routes/trendingRoutes.js';
import highlightRoutes from './routes/highlightRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import gdprRoutes from './routes/gdprRoutes.js';
import audioRoutes from './routes/audioRoutes.js';
import liveStreamRoutes from './routes/liveStreamRoutes.js';
import videoCallRoutes from './routes/videoCallRoutes.js';
import audioCallRoutes from './routes/audioCallRoutes.js';
import monetizationRoutes from './routes/monetizationRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

// Load environment variables
dotenv.config();

// ✅ Validate environment variables
const criticalEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalEnvVars = [
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'OPENAI_API_KEY',
];

const missingCritical = [];
criticalEnvVars.forEach((varName) => {
  if (!process.env[varName]) missingCritical.push(varName);
});

if (missingCritical.length > 0) {
  console.error(`❌ Missing CRITICAL env variables: ${missingCritical.join(', ')}`);
  process.exit(1);
}

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Missing');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'Missing');

// ✅ Connect to DB
connectDB();

// ✅ Connect to Redis (optional) - now handled in config/redis.js
console.log('✅ Redis configuration loaded');

// ✅ Initialize Express
const app = express();
const server = createServer(app);

// ✅ Add request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Add listener for when the response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logApiRequest(req, res, duration);
  });
  
  next();
});

// ✅ Enable compression
app.use(compression());

// ✅ Set server timeout to handle large file uploads
server.setTimeout(30 * 60 * 1000); // 30 minutes

// Add keep alive timeout as well
server.keepAliveTimeout = 30 * 60 * 1000; // 30 minutes
server.headersTimeout = 31 * 60 * 1000; // 31 minutes (should be longer than keepAliveTimeout)

// ✅ Security & Logging
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ✅ Serve static assets with CDN headers
app.use('/assets', express.static(path.join(process.cwd(), '..', 'frontend', 'dist', 'assets'), {
  setHeaders: (res, path) => {
    // Determine asset type based on file extension
    if (path.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      setCdnHeaders(res, 'images');
    } else if (path.match(/\.(css)$/i)) {
      setCdnHeaders(res, 'css');
    } else if (path.match(/\.(js)$/i)) {
      setCdnHeaders(res, 'js');
    } else if (path.match(/\.(woff|woff2|ttf|eot)$/i)) {
      setCdnHeaders(res, 'fonts');
    } else {
      setCdnHeaders(res, 'default');
    }
  }
}));

// ✅ Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ✅ Apply role-based rate limiting to specific routes
app.use('/api/admin', adminLimiter);
app.use('/api/creator', creatorLimiter);

// ✅ Health check endpoints (before other middleware for faster response)
app.get('/health', healthCheck);
app.get('/health/liveness', livenessCheck);
app.get('/health/readiness', readinessCheck);

// ✅ Input sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// ✅ Body parsing
app.use(express.json({ limit: '1500mb' })); // Increased from 10mb to 1500mb
app.use(express.urlencoded({ extended: true, limit: '1500mb' })); // Increased from 10mb to 1500mb

// ✅ CORS for Replit, Netlify & localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://192.168.1.3:5001',
  'http://192.168.1.3:5000',
  'http://192.168.1.3:3000',
  'http://localhost:5002',
  'http://192.168.1.3:5002',
  // Add your public IP here for self-hosting
  'http://YOUR_PUBLIC_IP:5001',
  'http://YOUR_PUBLIC_IP:3000',
  // Production domains
  'https://YOUR_DOMAIN.com',
  'https://www.YOUR_DOMAIN.com',
  // D4D Hub domains
  'https://d4dhub.com',
  'https://api.d4dhub.com',
  'https://www.d4dhub.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      // In production, be more strict about allowed origins
      if (process.env.NODE_ENV === 'production') {
        // Allow requests from allowed origins
        if (
          allowedOrigins.includes(origin) ||
          // Allow your domain
          /^https:\/\/.*YOUR_DOMAIN\.com$/.test(origin)
        ) {
          callback(null, true);
        } else {
          console.warn(`❌ CORS blocked in production: ${origin}`);
          callback(new Error('Not allowed by CORS in production'));
        }
      } else {
        // In development, be more permissive
        if (
          allowedOrigins.includes(origin) ||
          /\.replit\.dev$/.test(origin) ||    // Allow Replit domains
          /\.repl\.co$/.test(origin) ||       // Allow Repl.co domains
          /\.netlify\.app$/.test(origin) ||   // Allow any Netlify frontend
          /\.vercel\.app$/.test(origin) ||    // Optional: allow Vercel frontend
          /^http:\/\/192\.168\..*?:5001$/.test(origin) || // Allow local network IPs on port 5001
          /^http:\/\/192\.168\..*?:5002$/.test(origin) || // Allow local network IPs on port 5002
          /^http:\/\/192\.168\..*?:3000$/.test(origin) || // Allow local network IPs on port 3000
          // Allow your public IP
          /^http:\/\/YOUR_PUBLIC_IP.*$/.test(origin) ||
          // Allow any IP on ports 5001, 5002, 3000 (for self-hosting)
          /^http:\/\/\d+\.\d+\.\d+\.\d+:(5001|5002|3000)$/.test(origin) ||
          // Allow d4dhub.com domains
          /^https:\/\/.*d4dhub\.com$/.test(origin)
        ) {
          callback(null, true);
        } else {
          console.warn(`❌ CORS blocked in development: ${origin}`);
          callback(new Error('Not allowed by CORS in development'));
        }
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

// ✅ API Versioning Middleware
app.use((req, res, next) => {
  // Extract version from Accept header or URL path
  const acceptHeader = req.headers['accept'];
  let version = 'v1'; // default version
  
  // Check if version is specified in Accept header (e.g., application/vnd.d4dhub.v2+json)
  if (acceptHeader && acceptHeader.includes('application/vnd.d4dhub.')) {
    const versionMatch = acceptHeader.match(/application\/vnd\.d4dhub\.v(\d+)\+json/);
    if (versionMatch && versionMatch[1]) {
      version = `v${versionMatch[1]}`;
    }
  }
  
  // Check if version is specified in URL path (e.g., /api/v2/users)
  const versionInPath = req.path.match(/^\/api\/(v\d+)/);
  if (versionInPath && versionInPath[1]) {
    version = versionInPath[1];
  }
  
  // Attach version to request object
  req.apiVersion = version;
  next();
});

// ✅ Routes with versioning support
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 D4D HUB API running!',
    version: '1.0.0',
    api_versions: {
      v1: '/api/v1/',
      v2: '/api/v2/' // Future version endpoint
    },
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      posts: '/api/v1/posts',
      notifications: '/api/v1/notifications',
      messages: '/api/v1/messages',
      stories: '/api/v1/stories',
      explore: '/api/v1/explore',
      admin: '/api/v1/admin',
      groups: '/api/v1/groups',
      ai: '/api/v1/ai',
      subscription: '/api/v1/subscription',
      creator: '/api/v1/creator',
      superchat: '/api/v1/superchat',
      playlists: '/api/v1/playlists',
      watchlater: '/api/v1/watchlater',
      community: '/api/v1/community',
      notes: '/api/v1/notes',
      trending: '/api/v1/trending',
      highlights: '/api/v1/highlights',
      shopping: '/api/v1/shopping',
      business: '/api/v1/business',
    },
  });
});

// ✅ Versioned API routes
// Version 1 (current)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/creator', creatorRoutes);
app.use('/api/v1/superchat', superChatRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/watchlater', watchLaterRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/trending', trendingRoutes);
app.use('/api/v1/highlights', highlightRoutes);
app.use('/api/v1/shopping', shoppingRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/livestream', liveStreamRoutes);
app.use('/api/v1/videocall', videoCallRoutes);
app.use('/api/v1/audiocall', audioCallRoutes);
app.use('/api/v1/monetization', monetizationRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);

// ✅ Backward compatibility - non-versioned routes (will default to v1)
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
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/superchat', superChatRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/watchlater', watchLaterRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/livestream', liveStreamRoutes);
app.use('/api/videocall', videoCallRoutes);
app.use('/api/audiocall', audioCallRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/recommendations', recommendationRoutes);

// ✅ Error handling
app.use(notFound);
app.use(errorHandler);

// ✅ Start server
const PORT = process.env.PORT || 5000; // Changed default from 3000 to 5000 to match .env

// ✅ HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS or forwarded as HTTPS
    const isHttps = req.secure || req.header('x-forwarded-proto') === 'https';
    
    // If not HTTPS and not localhost, redirect to HTTPS
    if (!isHttps && !req.header('host').includes('localhost')) {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')} + *.replit.dev + *.netlify.app`);
  console.log(`📡 Socket.io initialized`);
  console.log(`🔧 API Versioning enabled - default: v1, supported: v1`);
});